"""
Virtual Try-On router — /api/v1/tryon

Endpoints:
  POST /tryon/session              — Start a try-on session
  POST /tryon/detect               — Detect body landmarks from an image frame
  PUT  /tryon/session/{id}/adjust  — Save user's manual adjustments (drag/pinch)
  POST /tryon/session/{id}/screenshot — Save composite screenshot
  GET  /tryon/session/{id}         — Retrieve session state
  GET  /tryon/history              — User's past try-on sessions
  GET  /products/{slug}/3d         — Get 3D model metadata for a product
"""
import uuid
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_user, PaginationParams
from app.core.exceptions import NotFound
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.tryon import Product3DModel, TryOnSession, TryOnStatus, JewelryPlacementType
from app.services import tryon as tryon_service
from app.services import model3d as model3d_service
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.tryon import (
    TryOnSessionCreate,
    TryOnSessionOut,
    DetectLandmarksRequest,
    DetectLandmarksResponse,
    SaveScreenshotRequest,
    SaveScreenshotResponse,
    UserAdjustmentUpdate,
    Product3DModelOut,
)

router = APIRouter(prefix="/tryon", tags=["Virtual Try-On"])
products_3d_router = APIRouter(prefix="/products", tags=["Virtual Try-On"])


# ── 3D model lookup (public, no auth required) ────────────────────────────────

@products_3d_router.get("/{slug}/3d", response_model=APIResponse[List[Product3DModelOut]])
async def get_product_3d_models(
    slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Returns all active 3D models for a product.
    Each model includes full placement config so the frontend renderer
    knows exactly where and how to anchor the 3D jewelry on the body.
    """
    product = await db.scalar(
        select(Product)
        .options(selectinload(Product.models_3d))
        .where(Product.slug == slug, Product.status == ProductStatus.active)
    )
    if not product:
        raise NotFound("Product")

    active_models = [m for m in product.models_3d if m.is_active]
    return APIResponse(
        data=[Product3DModelOut.model_validate(m) for m in active_models]
    )


# ── Session management ────────────────────────────────────────────────────────

@router.post("/session", response_model=APIResponse[TryOnSessionOut], status_code=201)
async def create_tryon_session(
    body: TryOnSessionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_current_user)] = None,
):
    """
    Start a virtual try-on session for a product.
    Returns the session ID + the 3D model config the frontend needs to
    initialise the Three.js / WebXR renderer.
    """
    product = await db.scalar(
        select(Product)
        .options(selectinload(Product.models_3d))
        .where(Product.id == body.product_id, Product.status == ProductStatus.active)
    )
    if not product:
        raise NotFound("Product")

    # Pick the best active 3D model
    active_model = next(
        (m for m in product.models_3d if m.is_active), None
    )

    session = TryOnSession(
        user_id=current_user.id if current_user else None,
        product_id=product.id,
        model_3d_id=active_model.id if active_model else None,
        status=TryOnStatus.active,
        input_mode=body.input_mode,
        device_type=body.device_type,
        screenshots=[],
    )
    db.add(session)
    await db.flush()
    await db.refresh(session, ["model_3d"])

    return APIResponse(
        message="Try-on session started.",
        data=TryOnSessionOut.model_validate(session),
    )


@router.post("/detect", response_model=APIResponse[DetectLandmarksResponse])
async def detect_landmarks(
    body: DetectLandmarksRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Accepts a base64 image frame (webcam snapshot or uploaded photo) and
    runs MediaPipe landmark detection calibrated for the jewelry type.

    The frontend calls this once per user, then keeps the landmark data
    client-side to drive the Three.js overlay on every frame.
    """
    session = await db.scalar(
        select(TryOnSession)
        .options(selectinload(TryOnSession.model_3d))
        .where(TryOnSession.id == body.session_id)
    )
    if not session:
        raise NotFound("Try-on session")

    # Determine placement type from the session's 3D model
    placement_type = JewelryPlacementType.necklace  # default fallback
    if session.model_3d:
        placement_type = session.model_3d.placement_type

    landmarks, confidence = await tryon_service.detect_landmarks(
        body.image_base64, placement_type
    )

    # Persist landmark data to the session for replay / sharing
    session.landmark_data = landmarks.model_dump()
    await db.flush()

    return APIResponse(
        data=DetectLandmarksResponse(
            session_id=session.id,
            landmarks=landmarks,
            placement_type=placement_type.value,
            detection_confidence=confidence,
        )
    )


@router.put("/session/{session_id}/adjust", response_model=APIResponse)
async def save_user_adjustments(
    session_id: str,
    body: UserAdjustmentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Persist the user's manual drag / pinch / rotate adjustments.
    These are applied on top of the ML-detected anchor points.
    """
    session = await db.get(TryOnSession, uuid.UUID(session_id))
    if not session:
        raise NotFound("Try-on session")

    current = session.user_adjustments or {}
    updates = body.model_dump(exclude={"session_id"}, exclude_none=True)
    session.user_adjustments = {**current, **updates}
    return APIResponse(message="Adjustments saved.")


@router.post("/session/{session_id}/screenshot", response_model=APIResponse[SaveScreenshotResponse])
async def save_screenshot(
    session_id: str,
    body: SaveScreenshotRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Upload a composite screenshot (user's photo + 3D model overlay) to CDN.
    The screenshot URL is appended to the session's screenshots list.
    """
    session = await db.get(TryOnSession, uuid.UUID(session_id))
    if not session:
        raise NotFound("Try-on session")

    screenshot_url = await model3d_service.save_tryon_screenshot(
        body.image_base64,
        session_id,
        str(session.product_id),
    )

    screenshots = list(session.screenshots or [])
    screenshots.append(screenshot_url)
    session.screenshots = screenshots

    if body.user_adjustments:
        current = session.user_adjustments or {}
        session.user_adjustments = {**current, **body.user_adjustments}

    return APIResponse(
        message="Screenshot saved.",
        data=SaveScreenshotResponse(
            screenshot_url=screenshot_url,
            session_id=session.id,
        ),
    )


@router.get("/session/{session_id}", response_model=APIResponse[TryOnSessionOut])
async def get_tryon_session(
    session_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    session = await db.scalar(
        select(TryOnSession)
        .options(selectinload(TryOnSession.model_3d))
        .where(TryOnSession.id == uuid.UUID(session_id))
    )
    if not session:
        raise NotFound("Try-on session")
    return APIResponse(data=TryOnSessionOut.model_validate(session))


@router.delete("/session/{session_id}", response_model=APIResponse)
async def abandon_session(
    session_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    session = await db.get(TryOnSession, uuid.UUID(session_id))
    if not session:
        raise NotFound("Try-on session")
    session.status = TryOnStatus.abandoned
    return APIResponse(message="Session abandoned.")


@router.get("/history", response_model=PaginatedResponse[TryOnSessionOut])
async def tryon_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    pagination: Annotated[PaginationParams, Depends()],
):
    """Returns the authenticated user's past try-on sessions with screenshots."""
    from sqlalchemy import func
    base_q = (
        select(TryOnSession)
        .options(selectinload(TryOnSession.model_3d))
        .where(
            TryOnSession.user_id == current_user.id,
            TryOnSession.status != TryOnStatus.abandoned,
        )
    )
    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    result = await db.scalars(
        base_q.order_by(TryOnSession.created_at.desc())
        .offset(pagination.offset).limit(pagination.limit)
    )
    sessions = result.all()

    return PaginatedResponse(
        items=[TryOnSessionOut.model_validate(s) for s in sessions],
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )
