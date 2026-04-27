from datetime import datetime, timezone, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.common import APIResponse

router = APIRouter(prefix="/admin/analytics", tags=["Admin — Analytics"])


@router.get("/sales", response_model=APIResponse)
async def sales_report(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
):
    now = datetime.now(timezone.utc)
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map[period]
    since = now - timedelta(days=days)

    # Daily revenue series
    daily = await db.execute(
        select(
            func.date_trunc("day", Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(Order.created_at >= since, Order.status == OrderStatus.delivered)
        .group_by("day")
        .order_by("day")
    )
    daily_data = [
        {"date": str(row.day.date()), "revenue": float(row.revenue), "orders": row.orders}
        for row in daily.all()
    ]

    # Order status distribution
    status_dist = await db.execute(
        select(Order.status, func.count(Order.id).label("count"))
        .where(Order.created_at >= since)
        .group_by(Order.status)
    )
    status_data = {row.status.value: row.count for row in status_dist.all()}

    return APIResponse(data={
        "period": period,
        "daily_series": daily_data,
        "status_distribution": status_data,
    })


@router.get("/top-products", response_model=APIResponse)
async def top_products(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(10, le=50),
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
):
    now = datetime.now(timezone.utc)
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    since = now - timedelta(days=days_map[period])

    result = await db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.total_price).label("revenue"),
        )
        .join(Order)
        .where(Order.created_at >= since, Order.status == OrderStatus.delivered)
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.total_price).desc())
        .limit(limit)
    )

    return APIResponse(data=[
        {
            "product_id": str(row.product_id),
            "product_name": row.product_name,
            "units_sold": int(row.units_sold),
            "revenue": float(row.revenue),
        }
        for row in result.all()
    ])


@router.get("/top-categories", response_model=APIResponse)
async def top_categories(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
):
    from app.models.category import Category

    now = datetime.now(timezone.utc)
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    since = now - timedelta(days=days_map[period])

    result = await db.execute(
        select(
            Category.name.label("category"),
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.total_price).label("revenue"),
        )
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .where(Order.created_at >= since, Order.status == OrderStatus.delivered)
        .group_by(Category.name)
        .order_by(func.sum(OrderItem.total_price).desc())
    )

    return APIResponse(data=[
        {"category": row.category, "units_sold": int(row.units_sold), "revenue": float(row.revenue)}
        for row in result.all()
    ])
