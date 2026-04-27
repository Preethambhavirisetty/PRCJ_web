import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.category import Category, Collection
from app.models.audit import AuditLog
from app.schemas.common import APIResponse
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut, CollectionCreate, CollectionOut

router = APIRouter(prefix="/admin/categories", tags=["Admin — Categories"])


@router.post("", response_model=APIResponse[CategoryOut], status_code=201)
async def create_category(
    body: CategoryCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.scalar(select(Category).where(Category.slug == body.slug))
    if existing:
        raise AlreadyExists("Category slug")
    cat = Category(**body.model_dump())
    db.add(cat)
    await db.flush()
    db.add(AuditLog(admin_id=admin.id, action="CREATE_CATEGORY", resource_type="category", resource_id=str(cat.id)))
    return APIResponse(message="Category created.", data=CategoryOut.model_validate(cat))


@router.put("/{category_id}", response_model=APIResponse[CategoryOut])
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    cat = await db.get(Category, uuid.UUID(category_id))
    if not cat:
        raise NotFound("Category")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.add(AuditLog(admin_id=admin.id, action="UPDATE_CATEGORY", resource_type="category", resource_id=category_id))
    await db.refresh(cat, ["children"])
    return APIResponse(message="Category updated.", data=CategoryOut.model_validate(cat))


@router.delete("/{category_id}", response_model=APIResponse)
async def delete_category(
    category_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    cat = await db.get(Category, uuid.UUID(category_id))
    if not cat:
        raise NotFound("Category")
    await db.delete(cat)
    db.add(AuditLog(admin_id=admin.id, action="DELETE_CATEGORY", resource_type="category", resource_id=category_id))
    return APIResponse(message="Category deleted.")


# ── Collections ───────────────────────────────────────────────────────────────

@router.post("/collections", response_model=APIResponse[CollectionOut], status_code=201)
async def create_collection(
    body: CollectionCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.scalar(select(Collection).where(Collection.slug == body.slug))
    if existing:
        raise AlreadyExists("Collection slug")
    coll = Collection(**body.model_dump())
    db.add(coll)
    await db.flush()
    return APIResponse(message="Collection created.", data=CollectionOut.model_validate(coll))
