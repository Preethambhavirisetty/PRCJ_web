import uuid
import secrets
from decimal import Decimal
from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import settings
from app.core.dependencies import get_current_verified_user, PaginationParams
from app.core.exceptions import NotFound, OutOfStock, PaymentFailed, InvalidCoupon
from app.core.security import verify_razorpay_signature
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderTracking, OrderStatus, PaymentMethod
from app.models.address import UserAddress
from app.models.product import Product, ProductVariant
from app.models.coupon import Coupon, CouponUsage, DiscountType
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.order import (
    CheckoutRequest, PaymentVerifyRequest,
    OrderOut, OrderSummaryOut,
)

router = APIRouter(prefix="/orders", tags=["Orders"])

GST_RATE = Decimal("0.03")   # 3% GST on jewellery
FREE_SHIPPING_THRESHOLD = Decimal("5000")
SHIPPING_CHARGE = Decimal("99")


def _generate_order_number() -> str:
    return f"PRCJ{secrets.token_hex(4).upper()}"


async def _validate_coupon(
    code: str,
    user_id: uuid.UUID,
    order_amount: Decimal,
    db: AsyncSession,
) -> tuple[Coupon, Decimal]:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    coupon = await db.scalar(
        select(Coupon).where(
            Coupon.code == code.upper(),
            Coupon.is_active == True,
            Coupon.valid_from <= now,
        )
    )
    if not coupon:
        raise InvalidCoupon()
    if coupon.valid_until and coupon.valid_until < now:
        raise InvalidCoupon("Coupon has expired.")
    if order_amount < coupon.min_order_amount:
        raise InvalidCoupon(f"Minimum order amount ₹{coupon.min_order_amount} required.")
    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        raise InvalidCoupon("Coupon usage limit reached.")

    user_usage = await db.scalar(
        select(func.count(CouponUsage.id)).where(
            CouponUsage.coupon_id == coupon.id,
            CouponUsage.user_id == user_id,
        )
    )
    if user_usage >= coupon.max_uses_per_user:
        raise InvalidCoupon("You have already used this coupon.")

    if coupon.discount_type == DiscountType.percentage:
        discount = order_amount * coupon.discount_value / 100
        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)
    elif coupon.discount_type == DiscountType.flat:
        discount = min(coupon.discount_value, order_amount)
    else:
        discount = Decimal("0")  # free_shipping handled separately

    return coupon, discount


@router.post("/checkout", response_model=APIResponse[OrderOut], status_code=201)
async def checkout(
    body: CheckoutRequest,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Fetch cart
    cart = await db.scalar(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product),
            selectinload(Cart.items).selectinload(CartItem.variant),
        )
        .where(Cart.user_id == current_user.id)
    )
    if not cart or not cart.items:
        raise NotFound("Cart is empty")

    # Validate address
    address = await db.scalar(
        select(UserAddress).where(
            UserAddress.id == body.address_id,
            UserAddress.user_id == current_user.id,
        )
    )
    if not address:
        raise NotFound("Address")

    # Build order items + validate stock
    order_items = []
    subtotal = Decimal("0")

    for item in cart.items:
        product = item.product
        variant = item.variant

        price = product.sale_price or product.price
        if variant:
            price += variant.price_modifier

        # Stock check & deduction
        if variant:
            if variant.stock < item.quantity:
                raise OutOfStock()
            variant.stock -= item.quantity
        else:
            if product.stock < item.quantity:
                raise OutOfStock()
            product.stock -= item.quantity

        line_total = price * item.quantity
        subtotal += line_total

        # Snapshot primary image
        await db.refresh(product, ["images"])
        primary = next((img for img in product.images if img.is_primary), None)

        order_items.append(
            OrderItem(
                product_id=product.id,
                variant_id=variant.id if variant else None,
                product_name=product.name,
                product_sku=product.sku,
                variant_label=variant.label if variant else None,
                image_url=primary.thumbnail_url if primary else None,
                quantity=item.quantity,
                unit_price=price,
                total_price=line_total,
            )
        )

    # Coupon
    coupon = None
    coupon_discount = Decimal("0")
    if body.coupon_code:
        coupon, coupon_discount = await _validate_coupon(
            body.coupon_code, current_user.id, subtotal, db
        )

    # Tax & shipping
    taxable = subtotal - coupon_discount
    tax = (taxable * GST_RATE).quantize(Decimal("0.01"))
    free_shipping = body.payment_method == PaymentMethod.cod.value or subtotal >= FREE_SHIPPING_THRESHOLD
    shipping = Decimal("0") if free_shipping else SHIPPING_CHARGE
    total = taxable + tax + shipping

    order = Order(
        order_number=_generate_order_number(),
        user_id=current_user.id,
        status=OrderStatus.pending_payment,
        subtotal=subtotal,
        discount=coupon_discount,
        tax=tax,
        shipping_charge=shipping,
        total=total,
        payment_method=body.payment_method,
        coupon_id=coupon.id if coupon else None,
        coupon_code=body.coupon_code.upper() if body.coupon_code else None,
        # Shipping snapshot
        shipping_name=address.full_name,
        shipping_phone=address.phone,
        shipping_line1=address.line1,
        shipping_line2=address.line2,
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_pincode=address.pincode,
        notes=body.notes,
    )
    db.add(order)
    await db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    db.add(OrderTracking(
        order_id=order.id,
        status=OrderStatus.pending_payment,
        message="Order placed. Awaiting payment.",
    ))

    # Create Razorpay order if online payment
    razorpay_order_id = None
    if body.payment_method != PaymentMethod.cod.value:
        try:
            import razorpay
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            rz_order = client.order.create({
                "amount": int(total * 100),  # paise
                "currency": "INR",
                "receipt": order.order_number,
            })
            razorpay_order_id = rz_order["id"]
            order.razorpay_order_id = razorpay_order_id
        except Exception:
            pass  # Payment service may not be configured in dev

    # Clear cart
    for item in cart.items:
        await db.delete(item)

    # Increment coupon usage
    if coupon:
        coupon.used_count += 1
        db.add(CouponUsage(coupon_id=coupon.id, user_id=current_user.id, order_id=order.id))

    await db.flush()
    await db.refresh(order, ["items", "tracking_events"])

    # TODO: await email_service.send_order_confirmation(current_user.email, order)

    return APIResponse(
        message="Order placed successfully.",
        data=OrderOut.model_validate(order),
    )


@router.post("/{order_id}/payment/verify", response_model=APIResponse[OrderOut])
async def verify_payment(
    order_id: str,
    body: PaymentVerifyRequest,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    order = await db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.tracking_events))
        .where(Order.id == UUID(order_id), Order.user_id == current_user.id)
    )
    if not order:
        raise NotFound("Order")

    if not verify_razorpay_signature(
        body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature
    ):
        raise PaymentFailed()

    order.razorpay_payment_id = body.razorpay_payment_id
    order.payment_verified = True
    order.status = OrderStatus.confirmed

    db.add(OrderTracking(
        order_id=order.id,
        status=OrderStatus.confirmed,
        message="Payment confirmed. Order is being processed.",
    ))

    return APIResponse(message="Payment verified.", data=OrderOut.model_validate(order))


@router.get("", response_model=PaginatedResponse[OrderSummaryOut])
async def list_my_orders(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    pagination: Annotated[PaginationParams, Depends()],
):
    base_q = select(Order).where(Order.user_id == current_user.id)
    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    result = await db.scalars(
        base_q.options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(pagination.offset).limit(pagination.limit)
    )
    orders = result.all()

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
    return PaginatedResponse(
        items=summaries,
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/{order_id}", response_model=APIResponse[OrderOut])
async def get_order(
    order_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    order = await db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.tracking_events))
        .where(Order.id == UUID(order_id), Order.user_id == current_user.id)
    )
    if not order:
        raise NotFound("Order")
    return APIResponse(data=OrderOut.model_validate(order))
