import uuid
from typing import Optional, List
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    gender: str
    sort_order: int = 0
    is_active: bool = True
    parent_id: Optional[uuid.UUID] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    gender: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    parent_id: Optional[uuid.UUID] = None


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    gender: str
    sort_order: int
    is_active: bool
    parent_id: Optional[uuid.UUID]
    children: List["CategoryOut"] = []

    model_config = {"from_attributes": True}


CategoryOut.model_rebuild()


class CollectionCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    banner_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0


class CollectionOut(CollectionCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}
