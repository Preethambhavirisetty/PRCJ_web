import uuid
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.product import Product, ProductImage, ProductVariant
from app.models.audit import AuditLog
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductDetailOut,
    ProductVariantCreate, ProductListOut,
)

router = APIRouter(prefix="/admin/products", tags=["Admin — Products"])


async def _log_action(
    db: AsyncSession,
    admin_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: str,
    changes: dict = None,
):
    db.add(AuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        changes=changes,
    ))


@router.get("", response_model=PaginatedResponse[ProductListOut])
async def list_all_products(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 24,
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    base_q = select(Product).options(
        selectinload(Product.images),
        selectinload(Product.category),
    )
    if status:
        base_q = base_q.where(Product.status == status)
    if search:
        term = f"%{search.strip()}%"
        base_q = base_q.where(
            or_(
                Product.name.ilike(term),
                Product.sku.ilike(term),
                Product.slug.ilike(term),
            )
        )

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    offset = (page - 1) * page_size
    result = await db.scalars(
        base_q.order_by(Product.created_at.desc()).offset(offset).limit(page_size)
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
        page=page,
        page_size=page_size,
        total_pages=((total or 0) + page_size - 1) // page_size,
    )


@router.post("", response_model=APIResponse[ProductDetailOut], status_code=201)
async def create_product(
    body: ProductCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing_slug = await db.scalar(select(Product).where(Product.slug == body.slug))
    if existing_slug:
        raise AlreadyExists("Product slug")
    existing_sku = await db.scalar(select(Product).where(Product.sku == body.sku))
    if existing_sku:
        raise AlreadyExists("Product SKU")

    product = Product(**body.model_dump())
    db.add(product)
    await db.flush()
    await _log_action(db, admin.id, "CREATE_PRODUCT", "product", str(product.id))
    await db.refresh(product, ["images", "variants", "category"])
    return APIResponse(
        message="Product created.", data=ProductDetailOut.model_validate(product)
    )


@router.get("/{product_id}", response_model=APIResponse[ProductDetailOut])
async def get_product_admin(
    product_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.scalar(
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.category),
        )
        .where(Product.id == uuid.UUID(product_id))
    )
    if not product:
        raise NotFound("Product")
    return APIResponse(data=ProductDetailOut.model_validate(product))


@router.put("/{product_id}", response_model=APIResponse[ProductDetailOut])
async def update_product(
    product_id: str,
    body: ProductUpdate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.get(Product, uuid.UUID(product_id))
    if not product:
        raise NotFound("Product")

    changes = {}
    for field, value in body.model_dump(exclude_unset=True).items():
        if getattr(product, field) != value:
            changes[field] = {"from": str(getattr(product, field)), "to": str(value)}
        setattr(product, field, value)

    await _log_action(db, admin.id, "UPDATE_PRODUCT", "product", product_id, changes)
    await db.refresh(product, ["images", "variants", "category"])
    return APIResponse(message="Product updated.", data=ProductDetailOut.model_validate(product))


@router.delete("/{product_id}", response_model=APIResponse)
async def delete_product(
    product_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.get(Product, uuid.UUID(product_id))
    if not product:
        raise NotFound("Product")
    await _log_action(db, admin.id, "DELETE_PRODUCT", "product", product_id)
    await db.delete(product)
    return APIResponse(message="Product deleted.")


# ── Image Upload ──────────────────────────────────────────────────────────────

@router.post("/{product_id}/images", response_model=APIResponse)
async def upload_product_images(
    product_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    files: List[UploadFile] = File(...),
    is_primary: bool = Form(False),
):
    product = await db.get(Product, uuid.UUID(product_id))
    if not product:
        raise NotFound("Product")

    from app.services.image import upload_product_image

    uploaded = []
    for i, file in enumerate(files):
        result = await upload_product_image(file, product_id)
        img = ProductImage(
            product_id=product.id,
            url=result["url"],
            thumbnail_url=result.get("thumbnail_url"),
            medium_url=result.get("medium_url"),
            alt_text=product.name,
            is_primary=is_primary and i == 0,
            sort_order=i,
        )
        db.add(img)
        uploaded.append(result["url"])

    await _log_action(
        db, admin.id, "UPLOAD_IMAGES", "product", product_id,
        {"count": len(files)}
    )
    return APIResponse(message=f"{len(files)} image(s) uploaded.", data={"urls": uploaded})


@router.delete("/{product_id}/images/{image_id}", response_model=APIResponse)
async def delete_product_image(
    product_id: str,
    image_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    img = await db.scalar(
        select(ProductImage).where(
            ProductImage.id == uuid.UUID(image_id),
            ProductImage.product_id == uuid.UUID(product_id),
        )
    )
    if not img:
        raise NotFound("Image")
    await db.delete(img)
    return APIResponse(message="Image deleted.")


# ── Variants ──────────────────────────────────────────────────────────────────

@router.post("/{product_id}/variants", response_model=APIResponse, status_code=201)
async def add_variant(
    product_id: str,
    body: ProductVariantCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.get(Product, uuid.UUID(product_id))
    if not product:
        raise NotFound("Product")
    variant = ProductVariant(product_id=product.id, **body.model_dump())
    db.add(variant)
    await db.flush()
    return APIResponse(message="Variant added.", data={"id": str(variant.id)})


@router.delete("/{product_id}/variants/{variant_id}", response_model=APIResponse)
async def delete_variant(
    product_id: str,
    variant_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from sqlalchemy import select
    variant = await db.scalar(
        select(ProductVariant).where(
            ProductVariant.id == uuid.UUID(variant_id),
            ProductVariant.product_id == uuid.UUID(product_id),
        )
    )
    if not variant:
        raise NotFound("Variant")
    await db.delete(variant)
    return APIResponse(message="Variant deleted.")
