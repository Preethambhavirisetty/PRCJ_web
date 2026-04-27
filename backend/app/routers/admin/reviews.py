import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.exceptions import NotFound
from app.models.user import User
from app.models.review import Review
from app.models.product import Product
from app.models.audit import AuditLog
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.review import ReviewOut

router = APIRouter(prefix="/admin/reviews", tags=["Admin — Reviews"])


@router.get("", response_model=PaginatedResponse[ReviewOut])
async def list_reviews(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 25,
    flagged: Optional[bool] = Query(None),
    is_approved: Optional[bool] = Query(None),
):
    base_q = select(Review)
    if flagged is not None:
        base_q = base_q.where(Review.is_flagged == flagged)
    if is_approved is not None:
        base_q = base_q.where(Review.is_approved == is_approved)

    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    offset = (page - 1) * page_size
    result = await db.scalars(
        base_q.order_by(Review.created_at.desc()).offset(offset).limit(page_size)
    )
    reviews = result.all()

    items = []
    for r in reviews:
        reviewer = await db.get(User, r.user_id)
        out = ReviewOut.model_validate(r)
        if reviewer:
            out.reviewer_name = f"{reviewer.first_name} {reviewer.last_name[0]}."
        items.append(out)

    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=((total or 0) + page_size - 1) // page_size,
    )


@router.put("/{review_id}/approve", response_model=APIResponse)
async def approve_review(
    review_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    review = await db.get(Review, uuid.UUID(review_id))
    if not review:
        raise NotFound("Review")

    review.is_approved = True
    review.is_flagged = False

    # Recalculate product rating
    product = await db.get(Product, review.product_id)
    if product:
        stats = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.product_id == product.id, Review.is_approved == True)
        )
        avg, count = stats.one()
        product.avg_rating = float(avg or 0)
        product.review_count = count or 0

    db.add(AuditLog(admin_id=admin.id, action="APPROVE_REVIEW", resource_type="review", resource_id=review_id))
    return APIResponse(message="Review approved.")


@router.delete("/{review_id}", response_model=APIResponse)
async def delete_review(
    review_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    review = await db.get(Review, uuid.UUID(review_id))
    if not review:
        raise NotFound("Review")

    product = await db.get(Product, review.product_id)
    await db.delete(review)
    await db.flush()

    if product:
        stats = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.product_id == product.id, Review.is_approved == True)
        )
        avg, count = stats.one()
        product.avg_rating = float(avg or 0)
        product.review_count = count or 0

    db.add(AuditLog(admin_id=admin.id, action="DELETE_REVIEW", resource_type="review", resource_id=review_id))
    return APIResponse(message="Review deleted.")
