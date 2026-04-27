import logging
from decimal import Decimal
from typing import Optional

from app.config import settings

logger = logging.getLogger("prcj.payment")


def _get_client():
    import razorpay
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def create_razorpay_order(
    amount: Decimal,
    currency: str = "INR",
    receipt: str = "",
    notes: Optional[dict] = None,
) -> dict:
    if not settings.RAZORPAY_KEY_ID:
        logger.warning("Razorpay not configured — returning mock order")
        return {
            "id": f"order_mock_{receipt}",
            "amount": int(amount * 100),
            "currency": currency,
            "status": "created",
        }
    try:
        client = _get_client()
        order = client.order.create({
            "amount": int(amount * 100),
            "currency": currency,
            "receipt": receipt[:40],  # Razorpay receipt max 40 chars
            "notes": notes or {},
        })
        return order
    except Exception as e:
        logger.error("Razorpay order creation failed: %s", e)
        raise


async def fetch_payment(payment_id: str) -> dict:
    if not settings.RAZORPAY_KEY_ID:
        return {"id": payment_id, "status": "captured"}
    try:
        client = _get_client()
        return client.payment.fetch(payment_id)
    except Exception as e:
        logger.error("Razorpay fetch payment failed: %s", e)
        raise


async def initiate_refund(payment_id: str, amount: Decimal, notes: str = "") -> dict:
    if not settings.RAZORPAY_KEY_ID:
        logger.warning("Razorpay not configured — mock refund for %s", payment_id)
        return {"id": f"rfnd_mock_{payment_id}", "status": "processed"}
    try:
        client = _get_client()
        refund = client.payment.refund(payment_id, {
            "amount": int(amount * 100),
            "notes": {"reason": notes},
        })
        return refund
    except Exception as e:
        logger.error("Razorpay refund failed for %s: %s", payment_id, e)
        raise
