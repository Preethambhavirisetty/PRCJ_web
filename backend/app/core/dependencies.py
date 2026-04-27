from typing import Annotated, Optional
from fastapi import Depends, Cookie, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.security import decode_token, is_token_blacklisted
from app.core.exceptions import (
    TokenInvalid,
    TokenExpired,
    PermissionDenied,
    AccountDisabled,
    AccountNotVerified,
)

bearer_scheme = HTTPBearer(auto_error=False)


async def _resolve_token(
    credentials: Optional[HTTPAuthorizationCredentials],
    expected_type: str,
) -> dict:
    if not credentials:
        raise TokenInvalid()
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise TokenExpired()
    except JWTError:
        raise TokenInvalid()

    if payload.get("type") != expected_type:
        raise TokenInvalid()

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        raise TokenInvalid()

    return payload


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)
    ],
):
    from app.models.user import User  # local import avoids circular deps

    payload = await _resolve_token(credentials, "access")
    user_id = payload.get("sub")

    user = await db.get(User, user_id)
    if user is None:
        raise TokenInvalid()
    if not user.is_active:
        raise AccountDisabled()
    return user


async def get_current_verified_user(
    user=Depends(get_current_user),
):
    if not user.is_verified:
        raise AccountNotVerified()
    return user


async def require_admin(
    user=Depends(get_current_verified_user),
):
    if user.role not in ("admin", "superadmin"):
        raise PermissionDenied("Admin access required.")
    return user


async def require_superadmin(
    user=Depends(get_current_verified_user),
):
    if user.role != "superadmin":
        raise PermissionDenied("Superadmin access required.")
    return user


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginationParams:
    def __init__(self, page: int = 1, page_size: int = 24):
        from app.config import settings
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), settings.MAX_PAGE_SIZE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size
