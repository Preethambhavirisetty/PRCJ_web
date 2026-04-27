from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger("prcj.exceptions")


class PRCJException(HTTPException):
    """Base application exception with structured error body."""

    def __init__(self, status_code: int, code: str, message: str, detail: str = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.extra_detail = detail


# ── Auth ─────────────────────────────────────────────────────────────────────

class InvalidCredentials(PRCJException):
    def __init__(self):
        super().__init__(401, "INVALID_CREDENTIALS", "Invalid email or password.")


class TokenExpired(PRCJException):
    def __init__(self):
        super().__init__(401, "TOKEN_EXPIRED", "Authentication token has expired.")


class TokenInvalid(PRCJException):
    def __init__(self):
        super().__init__(401, "TOKEN_INVALID", "Invalid authentication token.")


class AccountNotVerified(PRCJException):
    def __init__(self):
        super().__init__(403, "ACCOUNT_NOT_VERIFIED", "Please verify your email to continue.")


class AccountDisabled(PRCJException):
    def __init__(self):
        super().__init__(403, "ACCOUNT_DISABLED", "Your account has been suspended. Contact support.")


class PermissionDenied(PRCJException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(403, "PERMISSION_DENIED", message)


class OTPInvalid(PRCJException):
    def __init__(self):
        super().__init__(400, "OTP_INVALID", "Invalid or expired OTP.")


# ── Resource ─────────────────────────────────────────────────────────────────

class NotFound(PRCJException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(404, "NOT_FOUND", f"{resource} not found.")


class AlreadyExists(PRCJException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(409, "ALREADY_EXISTS", f"{resource} already exists.")


# ── Business ─────────────────────────────────────────────────────────────────

class OutOfStock(PRCJException):
    def __init__(self):
        super().__init__(400, "OUT_OF_STOCK", "One or more items are out of stock.")


class InvalidCoupon(PRCJException):
    def __init__(self, reason: str = "Coupon is invalid or expired."):
        super().__init__(400, "INVALID_COUPON", reason)


class PaymentFailed(PRCJException):
    def __init__(self):
        super().__init__(402, "PAYMENT_FAILED", "Payment verification failed.")


# ── Exception Handlers ───────────────────────────────────────────────────────

async def prcj_exception_handler(request: Request, exc: PRCJException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.code,
            "message": exc.message,
            "detail": exc.extra_detail,
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = []
    for e in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in e["loc"] if x != "body"),
            "message": e["msg"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "code": "VALIDATION_ERROR", "errors": errors},
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("DB integrity error: %s", exc.orig)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"success": False, "code": "CONFLICT", "message": "A record with this data already exists."},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "code": "INTERNAL_ERROR", "message": "An unexpected error occurred."},
    )
