from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.exceptions import NotFound
from app.models.category import Category, Collection
from app.schemas.common import APIResponse
from app.schemas.category import CategoryOut, CollectionOut

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=APIResponse[List[CategoryOut]])
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Returns full category tree (root nodes with nested children)."""
    result = await db.scalars(
        select(Category)
        .options(selectinload(Category.children).selectinload(Category.children))
        .where(Category.parent_id == None, Category.is_active == True)
        .order_by(Category.sort_order)
    )
    roots = result.all()
    return APIResponse(data=[CategoryOut.model_validate(c) for c in roots])


@router.get("/by-gender/{gender}", response_model=APIResponse[List[CategoryOut]])
async def categories_by_gender(
    gender: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(
        select(Category)
        .options(selectinload(Category.children))
        .where(
            Category.gender == gender,
            Category.parent_id == None,
            Category.is_active == True,
        )
        .order_by(Category.sort_order)
    )
    return APIResponse(data=[CategoryOut.model_validate(c) for c in result.all()])


@router.get("/collections", response_model=APIResponse[List[CollectionOut]])
async def list_collections(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(
        select(Collection)
        .where(Collection.is_active == True)
        .order_by(Collection.sort_order)
    )
    return APIResponse(data=[CollectionOut.model_validate(c) for c in result.all()])


@router.get("/{slug}", response_model=APIResponse[CategoryOut])
async def get_category(
    slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    category = await db.scalar(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.slug == slug, Category.is_active == True)
    )
    if not category:
        raise NotFound("Category")
    return APIResponse(data=CategoryOut.model_validate(category))
