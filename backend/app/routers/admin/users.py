import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import require_admin, require_superadmin
from app.core.exceptions import NotFound, PermissionDenied
from app.core.security import revoke_all_refresh_tokens
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.user import AdminUserOut, AdminUpdateUser

router = APIRouter(prefix="/admin/users", tags=["Admin — Users"])


@router.get("", response_model=PaginatedResponse[AdminUserOut])
async def list_users(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 25,
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    base_q = select(User).where(User.role == UserRole.customer)
    if q:
        base_q = base_q.where(
            User.email.ilike(f"%{q}%") | User.first_name.ilike(f"%{q}%")
        )
    if role:
        base_q = base_q.where(User.role == role)
    if is_active is not None:
        base_q = base_q.where(User.is_active == is_active)

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    offset = (page - 1) * page_size
    result = await db.scalars(
        base_q.order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    users = result.all()

    return PaginatedResponse(
        items=[AdminUserOut.model_validate(u) for u in users],
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=((total or 0) + page_size - 1) // page_size,
    )


@router.get("/{user_id}", response_model=APIResponse[AdminUserOut])
async def get_user(
    user_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFound("User")
    return APIResponse(data=AdminUserOut.model_validate(user))


@router.put("/{user_id}", response_model=APIResponse[AdminUserOut])
async def update_user(
    user_id: str,
    body: AdminUpdateUser,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFound("User")

    # Only superadmins can promote/demote roles
    if body.role and body.role != user.role.value:
        if admin.role != UserRole.superadmin:
            raise PermissionDenied("Only superadmins can change user roles.")

    changes = {}
    if body.is_active is not None and body.is_active != user.is_active:
        changes["is_active"] = {"from": user.is_active, "to": body.is_active}
        user.is_active = body.is_active
        if not body.is_active:
            # Revoke all sessions when banning
            await revoke_all_refresh_tokens(str(user.id))

    if body.role:
        changes["role"] = {"from": user.role.value, "to": body.role}
        user.role = UserRole(body.role)

    if body.is_verified is not None:
        changes["is_verified"] = {"from": user.is_verified, "to": body.is_verified}
        user.is_verified = body.is_verified

    db.add(AuditLog(
        admin_id=admin.id,
        action="UPDATE_USER",
        resource_type="user",
        resource_id=user_id,
        changes=changes,
    ))

    return APIResponse(message="User updated.", data=AdminUserOut.model_validate(user))


@router.get("/{user_id}/orders", response_model=APIResponse)
async def get_user_orders(
    user_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from app.models.order import Order
    from sqlalchemy.orm import selectinload
    result = await db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == uuid.UUID(user_id))
        .order_by(Order.created_at.desc())
    )
    orders = result.all()
    from app.schemas.order import OrderSummaryOut
    summaries = [
        OrderSummaryOut(
            id=o.id,
            order_number=o.order_number,
            status=o.status.value,
            total=o.total,
            item_count=len(o.items),
            created_at=o.created_at,
        )
        for o in orders
    ]
    return APIResponse(data=summaries)
