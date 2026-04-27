import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    product_id: uuid.UUID
    order_item_id: Optional[uuid.UUID] = None
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5.")
        return v


class ReviewOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    rating: int
    title: Optional[str]
    body: Optional[str]
    is_verified_purchase: bool
    reviewer_name: str = ""
    images: List[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewSummary(BaseModel):
    avg_rating: float
    total_reviews: int
    rating_breakdown: dict[int, int]  # {5: 20, 4: 10, ...}
