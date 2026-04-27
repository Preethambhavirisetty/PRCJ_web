import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
from jose import JWTError, jwt
from passlib.context import CryptContext
import redis.asyncio as aioredis

from app.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


# ── Password ─────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

TokenType = Literal["access", "refresh", "admin_access"]


def _create_token(
    subject: str,
    token_type: TokenType,
    extra_claims: dict,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_hex(16),
        **extra_claims,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str, role: str) -> str:
    return _create_token(
        subject=user_id,
        token_type="access",
        extra_claims={"role": role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        token_type="refresh",
        extra_claims={},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


# ── Token Blacklist (Redis) ───────────────────────────────────────────────────

async def blacklist_token(jti: str, exp: datetime) -> None:
    redis = await get_redis()
    ttl = int((exp - datetime.now(timezone.utc)).total_seconds())
    if ttl > 0:
        await redis.setex(f"blacklist:{jti}", ttl, "1")


async def is_token_blacklisted(jti: str) -> bool:
    redis = await get_redis()
    return bool(await redis.exists(f"blacklist:{jti}"))


# ── Refresh Token Store ───────────────────────────────────────────────────────

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def store_refresh_token(user_id: str, token: str) -> None:
    redis = await get_redis()
    token_hash = hash_token(token)
    ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await redis.setex(f"refresh:{user_id}:{token_hash}", ttl, "1")


async def validate_refresh_token(user_id: str, token: str) -> bool:
    redis = await get_redis()
    token_hash = hash_token(token)
    return bool(await redis.exists(f"refresh:{user_id}:{token_hash}"))


async def revoke_refresh_token(user_id: str, token: str) -> None:
    redis = await get_redis()
    token_hash = hash_token(token)
    await redis.delete(f"refresh:{user_id}:{token_hash}")


async def revoke_all_refresh_tokens(user_id: str) -> None:
    """Revoke all sessions — used on password change or account ban."""
    redis = await get_redis()
    pattern = f"refresh:{user_id}:*"
    async for key in redis.scan_iter(match=pattern):
        await redis.delete(key)


# ── OTP ───────────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)  # 6-digit


async def store_otp(identifier: str, purpose: str, otp: str) -> None:
    redis = await get_redis()
    hashed = hashlib.sha256(otp.encode()).hexdigest()
    ttl = settings.OTP_EXPIRE_MINUTES * 60
    await redis.setex(f"otp:{purpose}:{identifier}", ttl, hashed)


async def verify_otp(identifier: str, purpose: str, otp: str) -> bool:
    redis = await get_redis()
    stored = await redis.get(f"otp:{purpose}:{identifier}")
    if not stored:
        return False
    expected = hashlib.sha256(otp.encode()).hexdigest()
    if hmac.compare_digest(stored, expected):
        await redis.delete(f"otp:{purpose}:{identifier}")
        return True
    return False


# ── Razorpay webhook signature verification ──────────────────────────────────

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
