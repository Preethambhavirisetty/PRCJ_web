import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: Decimal
    max_discount_amount: Optional[Decimal] = None
    min_order_amount: Decimal = Decimal("0.00")
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    is_active: bool = True
    valid_from: datetime
    valid_until: Optional[datetime] = None


class CouponOut(CouponCreate):
    id: uuid.UUID
    used_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplyCouponRequest(BaseModel):
    code: str
    order_amount: Decimal


class ApplyCouponResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: Decimal
    discount_applied: Decimal
    final_amount: Decimal
    message: str
