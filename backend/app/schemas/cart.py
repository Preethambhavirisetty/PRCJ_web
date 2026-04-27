import uuid
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


class AddToCartRequest(BaseModel):
    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    quantity: int = 1

    class Config:
        json_schema_extra = {"example": {"product_id": "...", "quantity": 1}}


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID]
    quantity: int
    price_at_add: Decimal
    product_name: str = ""
    product_slug: str = ""
    product_image: Optional[str] = None
    variant_label: Optional[str] = None
    current_price: Decimal = Decimal("0")
    line_total: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    id: uuid.UUID
    items: List[CartItemOut]
    subtotal: Decimal
    item_count: int
