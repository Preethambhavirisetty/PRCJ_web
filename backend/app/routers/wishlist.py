from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_verified_user
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem
from app.models.product import Product, ProductStatus
from app.schemas.common import APIResponse
from app.schemas.product import ProductListOut

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


async def _get_wishlist(user: User, db: AsyncSession) -> Wishlist:
    wl = await db.scalar(
        select(Wishlist)
        .options(
            selectinload(Wishlist.items)
            .selectinload(WishlistItem.product)
            .selectinload(Product.images),
            selectinload(Wishlist.items)
            .selectinload(WishlistItem.product)
            .selectinload(Product.category),
        )
        .where(Wishlist.user_id == user.id)
    )
    if not wl:
        wl = Wishlist(user_id=user.id)
        db.add(wl)
        await db.flush()
    return wl


@router.get("", response_model=APIResponse[List[ProductListOut]])
async def get_wishlist(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    wl = await _get_wishlist(current_user, db)
    items = []
    for wi in wl.items:
        p = wi.product
        if p.status != ProductStatus.active:
            continue
        out = ProductListOut.model_validate(p)
        primary = next((img for img in p.images if img.is_primary), None)
        if primary:
            out.primary_image = primary.thumbnail_url or primary.url
        items.append(out)
    return APIResponse(data=items)


@router.post("/{product_id}", response_model=APIResponse)
async def add_to_wishlist(
    product_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    pid = UUID(product_id)
    product = await db.get(Product, pid)
    if not product:
        raise NotFound("Product")

    wl = await _get_wishlist(current_user, db)

    existing = await db.scalar(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wl.id,
            WishlistItem.product_id == pid,
        )
    )
    if existing:
        raise AlreadyExists("Product in wishlist")

    db.add(WishlistItem(wishlist_id=wl.id, product_id=pid))
    return APIResponse(message="Added to wishlist.")


@router.delete("/{product_id}", response_model=APIResponse)
async def remove_from_wishlist(
    product_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    pid = UUID(product_id)
    wl = await _get_wishlist(current_user, db)

    item = await db.scalar(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wl.id,
            WishlistItem.product_id == pid,
        )
    )
    if not item:
        raise NotFound("Wishlist item")
    await db.delete(item)
    return APIResponse(message="Removed from wishlist.")
