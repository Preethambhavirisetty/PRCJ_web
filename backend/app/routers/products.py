from typing import Annotated, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFound
from app.models.product import Product, ProductStatus
from app.models.category import Category
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.product import ProductListOut, ProductDetailOut

router = APIRouter(prefix="/products", tags=["Products"])


def _build_filter(
    query,
    category_slug: Optional[str],
    gender: Optional[str],
    metal_type: Optional[str],
    min_price: Optional[Decimal],
    max_price: Optional[Decimal],
    is_featured: Optional[bool],
    is_new_arrival: Optional[bool],
    is_best_seller: Optional[bool],
    in_stock: Optional[bool],
    q: Optional[str],
):
    conditions = [Product.status == ProductStatus.active]

    if category_slug:
        conditions.append(Category.slug == category_slug)
    if gender:
        conditions.append(Category.gender == gender)
    if metal_type:
        conditions.append(Product.metal_type == metal_type)
    if min_price is not None:
        conditions.append(Product.price >= min_price)
    if max_price is not None:
        conditions.append(Product.price <= max_price)
    if is_featured is not None:
        conditions.append(Product.is_featured == is_featured)
    if is_new_arrival is not None:
        conditions.append(Product.is_new_arrival == is_new_arrival)
    if is_best_seller is not None:
        conditions.append(Product.is_best_seller == is_best_seller)
    if in_stock:
        conditions.append(Product.stock > 0)
    if q:
        search_term = f"%{q.lower()}%"
        conditions.append(
            or_(
                func.lower(Product.name).like(search_term),
                func.lower(Product.short_description).like(search_term),
            )
        )

    return query.where(and_(*conditions))


@router.get("", response_model=PaginatedResponse[ProductListOut])
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    pagination: Annotated[PaginationParams, Depends()],
    category_slug: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    metal_type: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_new_arrival: Optional[bool] = Query(None),
    is_best_seller: Optional[bool] = Query(None),
    in_stock: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    q: Optional[str] = Query(None),
):
    base_q = (
        select(Product)
        .join(Category)
        .options(
            selectinload(Product.images),
            selectinload(Product.category),
        )
    )
    base_q = _build_filter(
        base_q, category_slug, gender, metal_type,
        min_price, max_price, is_featured, is_new_arrival,
        is_best_seller, in_stock, q,
    )

    sort_map = {
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "rating": Product.avg_rating.desc(),
        "newest": Product.created_at.desc(),
        "created_at": Product.created_at.desc(),
    }
    base_q = base_q.order_by(sort_map.get(sort_by, Product.created_at.desc()))

    total = await db.scalar(
        select(func.count()).select_from(base_q.subquery())
    )

    result = await db.scalars(
        base_q.offset(pagination.offset).limit(pagination.limit)
    )
    products = result.all()

    items = []
    for p in products:
        out = ProductListOut.model_validate(p)
        primary = next((img for img in p.images if img.is_primary), None)
        if primary:
            out.primary_image = primary.thumbnail_url or primary.url
        items.append(out)

    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/featured", response_model=APIResponse)
async def get_featured(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(8, le=24),
):
    result = await db.scalars(
        select(Product)
        .join(Category)
        .options(selectinload(Product.images), selectinload(Product.category))
        .where(Product.status == ProductStatus.active, Product.is_featured == True)
        .order_by(Product.avg_rating.desc())
        .limit(limit)
    )
    products = result.all()
    items = []
    for p in products:
        out = ProductListOut.model_validate(p)
        primary = next((img for img in p.images if img.is_primary), None)
        if primary:
            out.primary_image = primary.thumbnail_url or primary.url
        items.append(out)
    return APIResponse(data=items)


@router.get("/search", response_model=PaginatedResponse[ProductListOut])
async def search_products(
    q: str = Query(..., min_length=2),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    pagination: Annotated[PaginationParams, Depends()] = None,
):
    search_term = f"%{q.lower()}%"
    base_q = (
        select(Product)
        .join(Category)
        .options(selectinload(Product.images), selectinload(Product.category))
        .where(
            Product.status == ProductStatus.active,
            or_(
                func.lower(Product.name).like(search_term),
                func.lower(Product.description).like(search_term),
                func.lower(Product.short_description).like(search_term),
            ),
        )
        .order_by(Product.avg_rating.desc())
    )

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    result = await db.scalars(base_q.offset(pagination.offset).limit(pagination.limit))
    products = result.all()

    items = []
    for p in products:
        out = ProductListOut.model_validate(p)
        primary = next((img for img in p.images if img.is_primary), None)
        if primary:
            out.primary_image = primary.thumbnail_url or primary.url
        items.append(out)

    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/{slug}", response_model=APIResponse[ProductDetailOut])
async def get_product(
    slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.scalar(
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.category),
        )
        .where(Product.slug == slug, Product.status == ProductStatus.active)
    )
    if not product:
        raise NotFound("Product")

    return APIResponse(data=ProductDetailOut.model_validate(product))
