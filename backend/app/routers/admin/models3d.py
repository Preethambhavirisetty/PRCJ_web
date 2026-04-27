"""
Admin router for managing 3D models for virtual try-on.
POST   /admin/products/{id}/3d-model         — Upload GLB + register metadata
POST   /admin/products/{id}/3d-model/usdz    — Upload USDZ (iOS AR)
PUT    /admin/products/{id}/3d-model/{mid}   — Update placement config
DELETE /admin/products/{id}/3d-model/{mid}   — Remove 3D model
GET    /admin/products/{id}/3d-model         — List all 3D models for product
"""
import uuid
from typing import Annotated, List
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.product import Product
from app.models.tryon import Product3DModel, JewelryPlacementType
from app.models.audit import AuditLog
from app.services import model3d as model3d_service
from app.services.tryon import PLACEMENT_DEFAULTS
from app.schemas.common import APIResponse
from app.schemas.tryon import Product3DModelOut, Product3DModelCreate

router = APIRouter(prefix="/admin/products", tags=["Admin — 3D Models"])


@router.get("/{product_id}/3d-model", response_model=APIResponse[List[Product3DModelOut]])
async def list_3d_models(
    product_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.scalar(
        select(Product).options(selectinload(Product.models_3d))
        .where(Product.id == uuid.UUID(product_id))
    )
    if not product:
        raise NotFound("Product")
    return APIResponse(
        data=[Product3DModelOut.model_validate(m) for m in product.models_3d]
    )


@router.post("/{product_id}/3d-model", response_model=APIResponse[Product3DModelOut], status_code=201)
async def upload_3d_model(
    product_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="GLB or GLTF 3D model file"),
    placement_type: str = Form(..., description="Jewelry placement: necklace | earring | ring | bangle | maang_tikka | nath | haathphool | payal | bajuband | brooch | kamarband | chain | kada"),
    lighting_preset: str = Form("gold", description="gold | silver | kundan | diamond | polki"),
    polygon_count_override: int = Form(None),
):
    """
    Upload a GLB/GLTF 3D model for a product's virtual try-on.

    The backend:
      1. Validates file type and polygon count
      2. Uploads to Cloudinary CDN
      3. Seeds default placement config from PLACEMENT_DEFAULTS
      4. Creates the Product3DModel record
      5. Sets product.has_3d_model = True
    """
    product = await db.get(Product, uuid.UUID(product_id))
    if not product:
        raise NotFound("Product")

    # Validate placement type
    try:
        pt = JewelryPlacementType(placement_type)
    except ValueError:
        valid = [e.value for e in JewelryPlacementType]
        raise NotFound(f"Invalid placement_type '{placement_type}'. Valid: {valid}")

    # Check for duplicate placement type
    existing = await db.scalar(
        select(Product3DModel).where(
            Product3DModel.product_id == product.id,
            Product3DModel.placement_type == pt,
        )
    )
    if existing:
        raise AlreadyExists(f"3D model for placement '{placement_type}'")

    # Upload to Cloudinary
    upload_result = await model3d_service.upload_glb_model(file, product_id, placement_type)

    # Get sensible defaults for this placement type
    defaults = PLACEMENT_DEFAULTS.get(pt, {})

    model = Product3DModel(
        product_id=product.id,
        glb_url=upload_result["glb_url"],
        usdz_url=upload_result.get("usdz_url"),
        preview_render_url=upload_result.get("preview_render_url"),
        placement_type=pt,
        anchor_offset=defaults.get("anchor_offset", {"x": 0.0, "y": 0.0, "z": 0.0}),
        scale_x=defaults.get("scale_x", 1.0),
        scale_y=defaults.get("scale_y", 1.0),
        scale_z=defaults.get("scale_z", 1.0),
        rotation_x=defaults.get("rotation_x", 0.0),
        rotation_y=defaults.get("rotation_y", 0.0),
        rotation_z=defaults.get("rotation_z", 0.0),
        landmark_indices=defaults.get("landmark_indices", []),
        material_properties={
            "metalness": 0.9 if "gold" in lighting_preset else 0.7,
            "roughness": 0.1 if "diamond" not in lighting_preset else 0.0,
            "envMapIntensity": 1.5,
            "emissiveIntensity": 0.0,
            "clearcoat": 0.3,
            "clearcoatRoughness": 0.1,
        },
        lighting_preset=lighting_preset,
        is_active=True,
        glb_size_bytes=upload_result.get("glb_size_bytes"),
        polygon_count=polygon_count_override or upload_result.get("polygon_count"),
        cloudinary_public_id=upload_result.get("cloudinary_public_id"),
    )
    db.add(model)

    # Mark product as having a 3D model
    product.has_3d_model = True

    db.add(AuditLog(
        admin_id=admin.id,
        action="UPLOAD_3D_MODEL",
        resource_type="product_3d_model",
        resource_id=product_id,
        changes={"placement_type": placement_type, "glb_url": upload_result["glb_url"]},
    ))

    await db.flush()
    return APIResponse(
        message=f"3D model uploaded for placement: {placement_type}",
        data=Product3DModelOut.model_validate(model),
    )


@router.post("/{product_id}/3d-model/{model_id}/usdz", response_model=APIResponse)
async def upload_usdz(
    product_id: str,
    model_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="USDZ file for iOS AR Quick Look"),
):
    """Attach a USDZ file to an existing 3D model record for iOS AR support."""
    model = await db.scalar(
        select(Product3DModel).where(
            Product3DModel.id == uuid.UUID(model_id),
            Product3DModel.product_id == uuid.UUID(product_id),
        )
    )
    if not model:
        raise NotFound("3D Model")

    usdz_url = await model3d_service.upload_usdz_model(
        file, product_id, model.placement_type.value
    )
    model.usdz_url = usdz_url
    return APIResponse(message="USDZ uploaded for iOS AR.", data={"usdz_url": usdz_url})


@router.put("/{product_id}/3d-model/{model_id}", response_model=APIResponse[Product3DModelOut])
async def update_3d_model_config(
    product_id: str,
    model_id: str,
    body: Product3DModelCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fine-tune placement config (anchor offsets, scale, rotation) without
    re-uploading the model file. Use this to adjust AR positioning.
    """
    model = await db.scalar(
        select(Product3DModel).where(
            Product3DModel.id == uuid.UUID(model_id),
            Product3DModel.product_id == uuid.UUID(product_id),
        )
    )
    if not model:
        raise NotFound("3D Model")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(model, field, value)

    db.add(AuditLog(
        admin_id=admin.id,
        action="UPDATE_3D_MODEL_CONFIG",
        resource_type="product_3d_model",
        resource_id=model_id,
    ))
    return APIResponse(message="3D model config updated.", data=Product3DModelOut.model_validate(model))


@router.delete("/{product_id}/3d-model/{model_id}", response_model=APIResponse)
async def delete_3d_model(
    product_id: str,
    model_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    model = await db.scalar(
        select(Product3DModel).where(
            Product3DModel.id == uuid.UUID(model_id),
            Product3DModel.product_id == uuid.UUID(product_id),
        )
    )
    if not model:
        raise NotFound("3D Model")

    await db.delete(model)

    # Check if product still has any 3D models
    remaining = await db.scalar(
        select(Product3DModel).where(
            Product3DModel.product_id == uuid.UUID(product_id),
            Product3DModel.is_active == True,
        )
    )
    if not remaining:
        product = await db.get(Product, uuid.UUID(product_id))
        if product:
            product.has_3d_model = False

    db.add(AuditLog(
        admin_id=admin.id,
        action="DELETE_3D_MODEL",
        resource_type="product_3d_model",
        resource_id=model_id,
    ))
    return APIResponse(message="3D model deleted.")
