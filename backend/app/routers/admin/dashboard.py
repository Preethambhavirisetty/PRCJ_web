from datetime import datetime, timezone, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.order import Order, OrderStatus
from app.models.review import Review
from app.schemas.common import APIResponse

router = APIRouter(prefix="/admin/dashboard", tags=["Admin — Dashboard"])


@router.get("", response_model=APIResponse)
async def get_dashboard(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start.replace(day=1)

    # ── Revenue ───────────────────────────────────────────────────────────────
    delivered_filter = Order.status == OrderStatus.delivered

    total_revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(delivered_filter)
    )
    today_revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            delivered_filter, Order.created_at >= today_start
        )
    )
    week_revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            delivered_filter, Order.created_at >= week_start
        )
    )
    month_revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            delivered_filter, Order.created_at >= month_start
        )
    )

    # ── Orders ────────────────────────────────────────────────────────────────
    total_orders = await db.scalar(select(func.count(Order.id)))
    pending_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == OrderStatus.confirmed)
    )
    processing_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == OrderStatus.processing)
    )
    shipped_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == OrderStatus.shipped)
    )
    today_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )

    # ── Users ─────────────────────────────────────────────────────────────────
    total_users = await db.scalar(
        select(func.count(User.id)).where(User.role == "customer")
    )
    new_users_today = await db.scalar(
        select(func.count(User.id)).where(
            User.role == "customer", User.created_at >= today_start
        )
    )

    # ── Products ─────────────────────────────────────────────────────────────
    total_products = await db.scalar(
        select(func.count(Product.id)).where(Product.status == ProductStatus.active)
    )
    low_stock = await db.scalar(
        select(func.count(Product.id)).where(
            Product.status == ProductStatus.active,
            Product.stock <= Product.low_stock_threshold,
            Product.stock > 0,
        )
    )
    out_of_stock = await db.scalar(
        select(func.count(Product.id)).where(
            Product.status == ProductStatus.active, Product.stock == 0
        )
    )

    # ── Reviews ───────────────────────────────────────────────────────────────
    flagged_reviews = await db.scalar(
        select(func.count(Review.id)).where(Review.is_flagged == True)
    )

    return APIResponse(data={
        "revenue": {
            "total": float(total_revenue),
            "today": float(today_revenue),
            "this_week": float(week_revenue),
            "this_month": float(month_revenue),
        },
        "orders": {
            "total": total_orders,
            "today": today_orders,
            "pending": pending_orders,
            "processing": processing_orders,
            "shipped": shipped_orders,
        },
        "users": {
            "total": total_users,
            "new_today": new_users_today,
        },
        "products": {
            "total_active": total_products,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
        },
        "reviews": {
            "flagged": flagged_reviews,
        },
    })
