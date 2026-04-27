import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import require_admin, PaginationParams
from app.core.exceptions import NotFound
from app.models.user import User
from app.models.order import Order, OrderTracking, OrderStatus
from app.models.audit import AuditLog
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.order import OrderOut, AdminUpdateOrderStatus

router = APIRouter(prefix="/admin/orders", tags=["Admin — Orders"])


@router.get("", response_model=PaginatedResponse[OrderOut])
async def list_orders(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    pagination: Annotated[PaginationParams, Depends()],
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    base_q = select(Order).options(
        selectinload(Order.items),
        selectinload(Order.tracking_events),
    )
    if status:
        base_q = base_q.where(Order.status == status)
    if q:
        base_q = base_q.where(Order.order_number.ilike(f"%{q}%"))

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    result = await db.scalars(
        base_q.order_by(Order.created_at.desc())
        .offset(pagination.offset).limit(pagination.limit)
    )
    orders = result.all()

    return PaginatedResponse(
        items=[OrderOut.model_validate(o) for o in orders],
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/{order_id}", response_model=APIResponse[OrderOut])
async def get_order_admin(
    order_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    order = await db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.tracking_events))
        .where(Order.id == uuid.UUID(order_id))
    )
    if not order:
        raise NotFound("Order")
    return APIResponse(data=OrderOut.model_validate(order))


@router.put("/{order_id}/status", response_model=APIResponse[OrderOut])
async def update_order_status(
    order_id: str,
    body: AdminUpdateOrderStatus,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    order = await db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.tracking_events))
        .where(Order.id == uuid.UUID(order_id))
    )
    if not order:
        raise NotFound("Order")

    old_status = order.status.value
    order.status = OrderStatus(body.status)

    if body.tracking_number:
        order.tracking_number = body.tracking_number
    if body.courier_partner:
        order.courier_partner = body.courier_partner

    db.add(OrderTracking(
        order_id=order.id,
        status=OrderStatus(body.status),
        message=body.message,
        location=body.location,
    ))

    db.add(AuditLog(
        admin_id=admin.id,
        action="UPDATE_ORDER_STATUS",
        resource_type="order",
        resource_id=order_id,
        changes={"from": old_status, "to": body.status},
    ))

    # TODO: await email_service.send_order_status_update(order)
    return APIResponse(message="Order status updated.", data=OrderOut.model_validate(order))
