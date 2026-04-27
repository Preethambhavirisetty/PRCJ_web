from datetime import datetime, timezone, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.cart import Cart
from app.models.wishlist import Wishlist
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    store_refresh_token, validate_refresh_token, revoke_refresh_token,
    revoke_all_refresh_tokens, blacklist_token,
    generate_otp, store_otp, verify_otp,
)
from app.core.exceptions import (
    InvalidCredentials, TokenInvalid, TokenExpired,
    AccountDisabled, AccountNotVerified, AlreadyExists, OTPInvalid,
)
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    OTPVerifyRequest,
)
from app.schemas.common import APIResponse
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/register", response_model=APIResponse[UserOut], status_code=201)
@limiter.limit("10/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check uniqueness
    existing_email = await db.scalar(select(User).where(User.email == body.email))
    if existing_email:
        raise AlreadyExists("Email")

    existing_phone = await db.scalar(select(User).where(User.phone == body.phone))
    if existing_phone:
        raise AlreadyExists("Phone number")

    user = User(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email.lower(),
        phone=body.phone,
        password_hash=hash_password(body.password),
        role=UserRole.customer,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    # Provision empty cart + wishlist
    db.add(Cart(user_id=user.id))
    db.add(Wishlist(user_id=user.id))

    # Send verification OTP
    otp = generate_otp()
    await store_otp(body.email, "register", otp)

    # TODO: await email_service.send_otp(body.email, otp, purpose="registration")

    return APIResponse(
        message="Registration successful. Please verify your email with the OTP sent.",
        data=UserOut.model_validate(user),
    )


@router.post("/verify-email", response_model=APIResponse)
async def verify_email(
    body: OTPVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.scalar(select(User).where(User.email == body.identifier))
    if not user:
        raise OTPInvalid()

    valid = await verify_otp(body.identifier, "register", body.otp)
    if not valid:
        raise OTPInvalid()

    user.is_verified = True
    return APIResponse(message="Email verified successfully.")


@router.post("/login", response_model=APIResponse[TokenResponse])
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise InvalidCredentials()
    if not user.is_active:
        raise AccountDisabled()
    if not user.is_verified:
        raise AccountNotVerified()

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))
    await store_refresh_token(str(user.id), refresh_token)

    return APIResponse(
        message="Login successful.",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserOut.model_validate(user),
        ),
    )


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_tokens(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from jose import JWTError, ExpiredSignatureError
    try:
        payload = decode_token(body.refresh_token)
    except ExpiredSignatureError:
        raise TokenExpired()
    except JWTError:
        raise TokenInvalid()

    if payload.get("type") != "refresh":
        raise TokenInvalid()

    user_id = payload.get("sub")
    valid = await validate_refresh_token(user_id, body.refresh_token)
    if not valid:
        raise TokenInvalid()

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise TokenInvalid()

    # Rotate refresh token
    await revoke_refresh_token(user_id, body.refresh_token)
    new_access = create_access_token(str(user.id), user.role.value)
    new_refresh = create_refresh_token(str(user.id))
    await store_refresh_token(str(user.id), new_refresh)

    return APIResponse(
        message="Tokens refreshed.",
        data=TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/logout", response_model=APIResponse)
async def logout(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
):
    if credentials:
        try:
            payload = decode_token(credentials.credentials)
            jti = payload.get("jti")
            exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            if jti:
                await blacklist_token(jti, exp)
            # Also revoke all refresh tokens for this user
            user_id = payload.get("sub")
            if user_id:
                await revoke_all_refresh_tokens(user_id)
        except Exception:
            pass
    return APIResponse(message="Logged out successfully.")


@router.post("/forgot-password", response_model=APIResponse)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    # Always return 200 to prevent email enumeration
    if user and user.is_active:
        otp = generate_otp()
        await store_otp(body.email, "reset_password", otp)
        # TODO: await email_service.send_otp(body.email, otp, purpose="password_reset")
    return APIResponse(message="If that email exists, a reset OTP has been sent.")


@router.post("/reset-password", response_model=APIResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    valid = await verify_otp(body.email, "reset_password", body.otp)
    if not valid:
        raise OTPInvalid()

    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if not user:
        raise OTPInvalid()

    user.password_hash = hash_password(body.new_password)
    await revoke_all_refresh_tokens(str(user.id))
    return APIResponse(message="Password reset successfully. Please log in again.")


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    body: ChangePasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
):
    from app.core.dependencies import get_current_verified_user
    # resolve user from token
    from jose import JWTError
    if not credentials:
        raise TokenInvalid()
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise TokenInvalid()
    user = await db.get(User, payload.get("sub"))
    if not user:
        raise TokenInvalid()

    if not verify_password(body.current_password, user.password_hash):
        raise InvalidCredentials()

    user.password_hash = hash_password(body.new_password)
    await revoke_all_refresh_tokens(str(user.id))
    return APIResponse(message="Password changed. Please log in again.")


@router.post("/resend-otp", response_model=APIResponse)
@limiter.limit("3/minute")
async def resend_otp(
    request: Request,
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if user and not user.is_verified:
        otp = generate_otp()
        await store_otp(body.email, "register", otp)
        # TODO: await email_service.send_otp(body.email, otp, purpose="registration")
    return APIResponse(message="OTP resent if account exists and is unverified.")
