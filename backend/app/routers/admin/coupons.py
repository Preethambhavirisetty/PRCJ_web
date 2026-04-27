import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.coupon import Coupon
from app.models.audit import AuditLog
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.coupon import CouponCreate, CouponOut

router = APIRouter(prefix="/admin/coupons", tags=["Admin — Coupons"])


@router.get("", response_model=PaginatedResponse[CouponOut])
async def list_coupons(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 20,
    is_active: Optional[bool] = Query(None),
):
    base_q = select(Coupon)
    if is_active is not None:
        base_q = base_q.where(Coupon.is_active == is_active)

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    offset = (page - 1) * page_size
    result = await db.scalars(
        base_q.order_by(Coupon.created_at.desc()).offset(offset).limit(page_size)
    )
    coupons = result.all()

    return PaginatedResponse(
        items=[CouponOut.model_validate(c) for c in coupons],
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=((total or 0) + page_size - 1) // page_size,
    )


@router.post("", response_model=APIResponse[CouponOut], status_code=201)
async def create_coupon(
    body: CouponCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.scalar(
        select(Coupon).where(Coupon.code == body.code.upper())
    )
    if existing:
        raise AlreadyExists("Coupon code")

    coupon = Coupon(**{**body.model_dump(), "code": body.code.upper()})
    db.add(coupon)
    await db.flush()

    db.add(AuditLog(
        admin_id=admin.id,
        action="CREATE_COUPON",
        resource_type="coupon",
        resource_id=str(coupon.id),
    ))

    return APIResponse(message="Coupon created.", data=CouponOut.model_validate(coupon))


@router.put("/{coupon_id}/deactivate", response_model=APIResponse)
async def deactivate_coupon(
    coupon_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    coupon = await db.get(Coupon, uuid.UUID(coupon_id))
    if not coupon:
        raise NotFound("Coupon")
    coupon.is_active = False
    db.add(AuditLog(
        admin_id=admin.id,
        action="DEACTIVATE_COUPON",
        resource_type="coupon",
        resource_id=coupon_id,
    ))
    return APIResponse(message="Coupon deactivated.")


@router.delete("/{coupon_id}", response_model=APIResponse)
async def delete_coupon(
    coupon_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    coupon = await db.get(Coupon, uuid.UUID(coupon_id))
    if not coupon:
        raise NotFound("Coupon")
    await db.delete(coupon)
    db.add(AuditLog(
        admin_id=admin.id,
        action="DELETE_COUPON",
        resource_type="coupon",
        resource_id=coupon_id,
    ))
    return APIResponse(message="Coupon deleted.")
