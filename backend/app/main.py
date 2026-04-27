import logging
import logging.config
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base
from app.core.middleware import setup_middlewares
from app.core.exceptions import (
    PRCJException,
    prcj_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    generic_exception_handler,
)

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("prcj")


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 PRCJ Backend starting up [%s]", settings.ENVIRONMENT)

    # Create all tables (in production use Alembic migrations instead)
    if settings.is_development:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified.")

    # Bootstrap first superadmin if none exists
    await _bootstrap_superadmin()

    yield

    logger.info("PRCJ Backend shutting down.")
    await engine.dispose()


async def _bootstrap_superadmin():
    """Creates the first superadmin account on first startup if not present."""
    if not settings.FIRST_ADMIN_PASSWORD:
        return
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.models.cart import Cart
    from app.models.wishlist import Wishlist
    from app.core.security import hash_password

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(
            select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
        )
        if not existing:
            admin = User(
                first_name="Super",
                last_name="Admin",
                email=settings.FIRST_ADMIN_EMAIL,
                phone="9999999999",
                password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.superadmin,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            await db.flush()
            db.add(Cart(user_id=admin.id))
            db.add(Wishlist(user_id=admin.id))
            await db.commit()
            logger.info("✅ Superadmin bootstrapped: %s", settings.FIRST_ADMIN_EMAIL)


# ── Rate Limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


# ── App Factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="PRCJ Jewellery — API",
        description=(
            "Backend API for PRCJ — India's grandest online jewellery destination. "
            "Features: Indian jewellery catalogue (100+ categories), 8K product images, "
            "3D virtual try-on (MediaPipe AR for all jewelry types), cart, orders, "
            "Razorpay payments, reviews, wishlist, coupons, and full admin panel."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # Rate limiter state
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Security + logging middleware
    setup_middlewares(app)

    # Exception handlers
    app.add_exception_handler(PRCJException, prcj_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    from app.routers.auth import router as auth_router
    from app.routers.users import router as users_router
    from app.routers.products import router as products_router
    from app.routers.categories import router as categories_router
    from app.routers.cart import router as cart_router
    from app.routers.orders import router as orders_router
    from app.routers.reviews import router as reviews_router
    from app.routers.wishlist import router as wishlist_router
    from app.routers.tryon import router as tryon_router
    from app.routers.tryon import products_3d_router
    from app.routers.admin.dashboard import router as admin_dashboard_router
    from app.routers.admin.analytics import router as admin_analytics_router
    from app.routers.admin.products import router as admin_products_router
    from app.routers.admin.orders import router as admin_orders_router
    from app.routers.admin.users import router as admin_users_router
    from app.routers.admin.coupons import router as admin_coupons_router
    from app.routers.admin.reviews import router as admin_reviews_router
    from app.routers.admin.categories import router as admin_categories_router
    from app.routers.admin.models3d import router as admin_models3d_router

    API_PREFIX = "/api/v1"

    for router in [
        auth_router,
        users_router,
        products_router,
        products_3d_router,       # GET /products/{slug}/3d
        categories_router,
        cart_router,
        orders_router,
        reviews_router,
        wishlist_router,
        tryon_router,             # Virtual try-on endpoints
        admin_dashboard_router,
        admin_analytics_router,
        admin_products_router,
        admin_models3d_router,    # Admin 3D model upload
        admin_orders_router,
        admin_users_router,
        admin_coupons_router,
        admin_reviews_router,
        admin_categories_router,
    ]:
        app.include_router(router, prefix=API_PREFIX)

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health():
        return {"status": "ok", "service": "prcj-api", "version": settings.APP_VERSION}

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "message": "Welcome to PRCJ Jewellery API",
            "version": settings.APP_VERSION,
            "docs": "/docs",
        }

    return app


app = create_app()
