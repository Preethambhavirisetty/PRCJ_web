import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import settings

logger = logging.getLogger("prcj.email")


def _build_otp_email(recipient: str, otp: str, purpose: str) -> MIMEMultipart:
    purpose_labels = {
        "register": "Email Verification",
        "reset_password": "Password Reset",
        "login_2fa": "Login Verification",
    }
    label = purpose_labels.get(purpose, "Verification")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"PRCJ Jewellery — {label} OTP"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = recipient

    text = f"Your PRCJ {label} OTP is: {otp}\nThis OTP expires in {settings.OTP_EXPIRE_MINUTES} minutes."

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Georgia, serif; background: #fdf6ee; margin: 0; padding: 0;">
      <div style="max-width: 520px; margin: 40px auto; background: #fff;
                  border: 1px solid #e8d5b0; border-radius: 8px; overflow: hidden;">
        <div style="background: #8b1a1a; padding: 24px; text-align: center;">
          <h1 style="color: #ffd700; font-size: 28px; margin: 0; letter-spacing: 3px;">PRCJ</h1>
          <p style="color: #f5deb3; margin: 4px 0 0; font-size: 13px; letter-spacing: 2px;">
            JEWELLERY
          </p>
        </div>
        <div style="padding: 36px 40px;">
          <h2 style="color: #8b1a1a; margin-top: 0;">{label}</h2>
          <p style="color: #555; font-size: 15px;">
            Use the following OTP to complete your {label.lower()}:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px;
                         color: #8b1a1a; background: #fdf6ee; padding: 12px 24px;
                         border-radius: 6px; border: 2px dashed #e8d5b0;">
              {otp}
            </span>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            This OTP is valid for <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.
            Do not share it with anyone.
          </p>
        </div>
        <div style="background: #fdf6ee; padding: 16px; text-align: center;
                    border-top: 1px solid #e8d5b0;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">
            © 2025 PRCJ Jewellery. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def _build_order_email(
    recipient: str, order_number: str, status: str, customer_name: str
) -> MIMEMultipart:
    status_messages = {
        "confirmed": "Your order has been confirmed and is being processed.",
        "shipped": "Great news! Your order has been shipped.",
        "out_for_delivery": "Your order is out for delivery today!",
        "delivered": "Your order has been delivered. Enjoy your jewellery!",
        "cancelled": "Your order has been cancelled. Refund will be processed in 5-7 days.",
    }
    message = status_messages.get(status, f"Your order status has been updated to: {status}")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"PRCJ Order {order_number} — {status.replace('_', ' ').title()}"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = recipient

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Georgia, serif; background: #fdf6ee; margin: 0; padding: 0;">
      <div style="max-width: 520px; margin: 40px auto; background: #fff;
                  border: 1px solid #e8d5b0; border-radius: 8px; overflow: hidden;">
        <div style="background: #8b1a1a; padding: 24px; text-align: center;">
          <h1 style="color: #ffd700; font-size: 28px; margin: 0; letter-spacing: 3px;">PRCJ</h1>
          <p style="color: #f5deb3; margin: 4px 0 0; font-size: 13px;">JEWELLERY</p>
        </div>
        <div style="padding: 36px 40px;">
          <p style="color: #555;">Dear {customer_name},</p>
          <p style="color: #555; font-size: 15px;">{message}</p>
          <div style="background: #fdf6ee; border: 1px solid #e8d5b0; border-radius: 6px;
                      padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0 0 4px;">ORDER NUMBER</p>
            <p style="color: #8b1a1a; font-size: 20px; font-weight: bold; margin: 0;">
              {order_number}
            </p>
          </div>
          <p style="color: #888; font-size: 13px;">
            You can track your order in the PRCJ app or website under My Orders.
          </p>
        </div>
        <div style="background: #fdf6ee; padding: 16px; text-align: center;
                    border-top: 1px solid #e8d5b0;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">
            © 2025 PRCJ Jewellery | support@prcj.in
          </p>
        </div>
      </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))
    return msg


async def send_otp(email: str, otp: str, purpose: str) -> bool:
    if not settings.SMTP_USER:
        logger.warning("SMTP not configured — skipping OTP email to %s", email)
        return False
    try:
        msg = _build_otp_email(email, otp, purpose)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email, msg.as_string())
        return True
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", email, e)
        return False


async def send_order_status_update(
    email: str, order_number: str, status: str, customer_name: str
) -> bool:
    if not settings.SMTP_USER:
        logger.warning("SMTP not configured — skipping order email to %s", email)
        return False
    try:
        msg = _build_order_email(email, order_number, status, customer_name)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email, msg.as_string())
        return True
    except Exception as e:
        logger.error("Failed to send order email to %s: %s", email, e)
        return False
