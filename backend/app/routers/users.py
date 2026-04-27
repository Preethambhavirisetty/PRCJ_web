from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.dependencies import get_current_verified_user
from app.core.exceptions import NotFound, AlreadyExists
from app.models.user import User
from app.models.address import UserAddress
from app.schemas.common import APIResponse
from app.schemas.user import UserOut, UpdateProfileRequest, AddressCreate, AddressUpdate, AddressOut

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=APIResponse[UserOut])
async def get_profile(
    current_user: Annotated[User, Depends(get_current_verified_user)],
):
    return APIResponse(data=UserOut.model_validate(current_user))


@router.put("/me", response_model=APIResponse[UserOut])
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if body.first_name:
        current_user.first_name = body.first_name
    if body.last_name:
        current_user.last_name = body.last_name
    if body.phone:
        existing = await db.scalar(
            select(User).where(User.phone == body.phone, User.id != current_user.id)
        )
        if existing:
            raise AlreadyExists("Phone number")
        current_user.phone = body.phone
    return APIResponse(message="Profile updated.", data=UserOut.model_validate(current_user))


# ── Addresses ─────────────────────────────────────────────────────────────────

@router.get("/me/addresses", response_model=APIResponse[List[AddressOut]])
async def list_addresses(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(
        select(UserAddress).where(UserAddress.user_id == current_user.id)
    )
    addresses = result.all()
    return APIResponse(data=[AddressOut.model_validate(a) for a in addresses])


@router.post("/me/addresses", response_model=APIResponse[AddressOut], status_code=201)
async def add_address(
    body: AddressCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if body.is_default:
        # Unset other defaults
        existing = await db.scalars(
            select(UserAddress).where(
                UserAddress.user_id == current_user.id,
                UserAddress.is_default == True,
            )
        )
        for addr in existing.all():
            addr.is_default = False

    address = UserAddress(user_id=current_user.id, **body.model_dump())
    db.add(address)
    await db.flush()
    return APIResponse(
        message="Address added.", data=AddressOut.model_validate(address), status_code=201
    )


@router.put("/me/addresses/{address_id}", response_model=APIResponse[AddressOut])
async def update_address(
    address_id: str,
    body: AddressUpdate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    address = await db.scalar(
        select(UserAddress).where(
            UserAddress.id == UUID(address_id),
            UserAddress.user_id == current_user.id,
        )
    )
    if not address:
        raise NotFound("Address")

    if body.is_default:
        existing = await db.scalars(
            select(UserAddress).where(
                UserAddress.user_id == current_user.id,
                UserAddress.is_default == True,
                UserAddress.id != address.id,
            )
        )
        for addr in existing.all():
            addr.is_default = False

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(address, field, value)

    return APIResponse(message="Address updated.", data=AddressOut.model_validate(address))


@router.delete("/me/addresses/{address_id}", response_model=APIResponse)
async def delete_address(
    address_id: str,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from uuid import UUID
    address = await db.scalar(
        select(UserAddress).where(
            UserAddress.id == UUID(address_id),
            UserAddress.user_id == current_user.id,
        )
    )
    if not address:
        raise NotFound("Address")
    await db.delete(address)
    return APIResponse(message="Address deleted.")
