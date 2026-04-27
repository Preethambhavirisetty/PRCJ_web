from typing import Annotated, List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import get_current_verified_user, PaginationParams
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.product import Product
from app.models.review import Review, ReviewImage
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewOut, ReviewSummary

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=APIResponse[ReviewOut], status_code=201)
async def create_review(
    body: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    product = await db.get(Product, body.product_id)
    if not product:
        raise NotFound("Product")

    # One review per user per product
    existing = await db.scalar(
        select(Review).where(
            Review.product_id == body.product_id,
            Review.user_id == current_user.id,
        )
    )
    if existing:
        raise AlreadyExists("Review")

    # Check if verified purchase
    is_verified = False
    if body.order_item_id:
        oi = await db.scalar(
            select(OrderItem)
            .join(Order)
            .where(
                OrderItem.id == body.order_item_id,
                OrderItem.product_id == body.product_id,
                Order.user_id == current_user.id,
                Order.status == OrderStatus.delivered,
            )
        )
        is_verified = oi is not None

    review = Review(
        product_id=body.product_id,
        user_id=current_user.id,
        order_item_id=body.order_item_id,
        rating=body.rating,
        title=body.title,
        body=body.body,
        is_verified_purchase=is_verified,
    )
    db.add(review)
    await db.flush()

    # Update product aggregates
    stats = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.product_id == body.product_id, Review.is_approved == True)
    )
    avg, count = stats.one()
    product.avg_rating = float(avg or 0)
    product.review_count = count or 0

    out = ReviewOut.model_validate(review)
    out.reviewer_name = f"{current_user.first_name} {current_user.last_name[0]}."
    return APIResponse(message="Review submitted.", data=out)


@router.get("/product/{product_id}", response_model=PaginatedResponse[ReviewOut])
async def get_product_reviews(
    product_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    pagination: Annotated[PaginationParams, Depends()],
):
    from uuid import UUID
    pid = UUID(product_id)
    base_q = select(Review).where(
        Review.product_id == pid,
        Review.is_approved == True,
    )
    total = await db.scalar(select(func.count()).select_from(base_q.subquery()))
    result = await db.scalars(
        base_q.order_by(Review.created_at.desc())
        .offset(pagination.offset).limit(pagination.limit)
    )
    reviews = result.all()

    items = []
    for r in reviews:
        user = await db.get(User, r.user_id)
        out = ReviewOut.model_validate(r)
        if user:
            out.reviewer_name = f"{user.first_name} {user.last_name[0]}."
        items.append(out)

    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=((total or 0) + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/product/{product_id}/summary", response_model=APIResponse[ReviewSummary])
async def get_review_summary(
    product_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    pid = UUID(product_id)

    stats = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.product_id == pid, Review.is_approved == True)
    )
    avg, total = stats.one()

    breakdown = {}
    for star in range(1, 6):
        count = await db.scalar(
            select(func.count(Review.id)).where(
                Review.product_id == pid,
                Review.rating == star,
                Review.is_approved == True,
            )
        )
        breakdown[star] = count or 0

    return APIResponse(data=ReviewSummary(
        avg_rating=round(float(avg or 0), 1),
        total_reviews=total or 0,
        rating_breakdown=breakdown,
    ))


@router.post("/{review_id}/flag", response_model=APIResponse)
async def flag_review(
    review_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    review = await db.get(Review, UUID(review_id))
    if not review:
        raise NotFound("Review")
    review.is_flagged = True
    return APIResponse(message="Review flagged for moderation.")
