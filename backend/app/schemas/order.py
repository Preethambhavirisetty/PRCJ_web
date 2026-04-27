import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    address_id: uuid.UUID
    payment_method: str
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID]
    product_name: str
    product_sku: str
    variant_label: Optional[str]
    image_url: Optional[str]
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}


class TrackingEventOut(BaseModel):
    status: str
    message: Optional[str]
    location: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    order_number: str
    status: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    shipping_charge: Decimal
    total: Decimal
    payment_method: Optional[str]
    payment_verified: bool
    coupon_code: Optional[str]
    shipping_name: str
    shipping_phone: str
    shipping_city: str
    shipping_state: str
    shipping_pincode: str
    tracking_number: Optional[str]
    courier_partner: Optional[str]
    notes: Optional[str]
    items: List[OrderItemOut]
    tracking_events: List[TrackingEventOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderSummaryOut(BaseModel):
    id: uuid.UUID
    order_number: str
    status: str
    total: Decimal
    item_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Admin schemas

class AdminUpdateOrderStatus(BaseModel):
    status: str
    message: Optional[str] = None
    location: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_partner: Optional[str] = None
