import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class ProductImageOut(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: Optional[str]
    medium_url: Optional[str]
    alt_text: Optional[str]
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ProductVariantOut(BaseModel):
    id: uuid.UUID
    label: str
    size: Optional[str]
    metal_type: Optional[str]
    price_modifier: Decimal
    stock: int
    sku_suffix: Optional[str]

    model_config = {"from_attributes": True}


class CategoryBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    gender: str

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    sku: str
    price: Decimal
    sale_price: Optional[Decimal]
    metal_type: str
    weight_gm: Optional[float]
    purity: Optional[str]
    stock: int
    status: str
    is_featured: bool
    is_new_arrival: bool
    is_best_seller: bool
    avg_rating: float
    review_count: int
    primary_image: Optional[str] = None  # populated in router
    category: CategoryBrief

    model_config = {"from_attributes": True}


class ProductDetailOut(ProductListOut):
    description: Optional[str]
    short_description: Optional[str]
    stone_details: Optional[str]
    making_charges: Optional[Decimal]
    meta_title: Optional[str]
    meta_description: Optional[str]
    images: List[ProductImageOut]
    variants: List[ProductVariantOut]
    low_stock_threshold: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Admin create/update schemas

class ProductCreate(BaseModel):
    name: str
    slug: str
    sku: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: uuid.UUID
    price: Decimal
    sale_price: Optional[Decimal] = None
    metal_type: str
    weight_gm: Optional[float] = None
    purity: Optional[str] = None
    stone_details: Optional[str] = None
    making_charges: Optional[Decimal] = None
    stock: int = 0
    low_stock_threshold: int = 5
    status: str = "draft"
    is_featured: bool = False
    is_new_arrival: bool = False
    is_best_seller: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0.")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    metal_type: Optional[str] = None
    weight_gm: Optional[float] = None
    purity: Optional[str] = None
    stone_details: Optional[str] = None
    making_charges: Optional[Decimal] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ProductVariantCreate(BaseModel):
    label: str
    size: Optional[str] = None
    metal_type: Optional[str] = None
    price_modifier: Decimal = Decimal("0.00")
    stock: int = 0
    sku_suffix: Optional[str] = None


class ProductFilterParams(BaseModel):
    category_slug: Optional[str] = None
    gender: Optional[str] = None
    metal_type: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    in_stock: Optional[bool] = None
    sort_by: str = "created_at"      # price_asc | price_desc | rating | newest
    q: Optional[str] = None          # search query
