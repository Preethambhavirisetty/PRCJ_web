from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import get_current_verified_user
from app.core.exceptions import NotFound, OutOfStock
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.cart import AddToCartRequest, UpdateCartItemRequest, CartOut, CartItemOut

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _get_cart(user: User, db: AsyncSession) -> Cart:
    cart = await db.scalar(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.variant),
        )
        .where(Cart.user_id == user.id)
    )
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        await db.flush()
    return cart


def _build_cart_out(cart: Cart) -> CartOut:
    items_out = []
    subtotal = Decimal("0")

    for item in cart.items:
        p = item.product
        primary_img = next((img for img in p.images if img.is_primary), None)

        variant_label = item.variant.label if item.variant else None
        current_price = p.sale_price or p.price
        if item.variant:
            current_price += item.variant.price_modifier

        line_total = current_price * item.quantity
        subtotal += line_total

        items_out.append(
            CartItemOut(
                id=item.id,
                product_id=p.id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                price_at_add=item.price_at_add,
                product_name=p.name,
                product_slug=p.slug,
                product_image=primary_img.thumbnail_url if primary_img else None,
                variant_label=variant_label,
                current_price=current_price,
                line_total=line_total,
            )
        )

    return CartOut(id=cart.id, items=items_out, subtotal=subtotal, item_count=len(items_out))


@router.get("", response_model=APIResponse[CartOut])
async def get_cart(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    cart = await _get_cart(current_user, db)
    return APIResponse(data=_build_cart_out(cart))


@router.post("/items", response_model=APIResponse[CartOut], status_code=201)
async def add_to_cart(
    body: AddToCartRequest,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.get(Product, body.product_id)
    if not product:
        raise NotFound("Product")

    variant = None
    if body.variant_id:
        variant = await db.get(ProductVariant, body.variant_id)
        if not variant or variant.product_id != product.id:
            raise NotFound("Product variant")
        if variant.stock < body.quantity:
            raise OutOfStock()
    else:
        if product.stock < body.quantity:
            raise OutOfStock()

    price = (product.sale_price or product.price)
    if variant:
        price += variant.price_modifier

    cart = await _get_cart(current_user, db)

    # Check if item already in cart
    existing = await db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == body.product_id,
            CartItem.variant_id == body.variant_id,
        )
    )
    if existing:
        new_qty = existing.quantity + body.quantity
        stock = variant.stock if variant else product.stock
        if new_qty > stock:
            raise OutOfStock()
        existing.quantity = new_qty
    else:
        db.add(CartItem(
            cart_id=cart.id,
            product_id=body.product_id,
            variant_id=body.variant_id,
            quantity=body.quantity,
            price_at_add=price,
        ))

    await db.flush()
    cart = await _get_cart(current_user, db)
    return APIResponse(message="Item added to cart.", data=_build_cart_out(cart))


@router.put("/items/{item_id}", response_model=APIResponse[CartOut])
async def update_cart_item(
    item_id: str,
    body: UpdateCartItemRequest,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    cart = await _get_cart(current_user, db)
    item = await db.scalar(
        select(CartItem).where(
            CartItem.id == UUID(item_id),
            CartItem.cart_id == cart.id,
        )
    )
    if not item:
        raise NotFound("Cart item")

    if body.quantity <= 0:
        await db.delete(item)
    else:
        product = await db.get(Product, item.product_id)
        stock = product.stock
        if item.variant_id:
            variant = await db.get(ProductVariant, item.variant_id)
            stock = variant.stock
        if body.quantity > stock:
            raise OutOfStock()
        item.quantity = body.quantity

    await db.flush()
    cart = await _get_cart(current_user, db)
    return APIResponse(message="Cart updated.", data=_build_cart_out(cart))


@router.delete("/items/{item_id}", response_model=APIResponse[CartOut])
async def remove_cart_item(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    cart = await _get_cart(current_user, db)
    item = await db.scalar(
        select(CartItem).where(
            CartItem.id == UUID(item_id),
            CartItem.cart_id == cart.id,
        )
    )
    if not item:
        raise NotFound("Cart item")
    await db.delete(item)
    await db.flush()
    cart = await _get_cart(current_user, db)
    return APIResponse(message="Item removed from cart.", data=_build_cart_out(cart))


@router.delete("", response_model=APIResponse)
async def clear_cart(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    cart = await _get_cart(current_user, db)
    for item in cart.items:
        await db.delete(item)
    return APIResponse(message="Cart cleared.")
