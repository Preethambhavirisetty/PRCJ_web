import io
import logging
from typing import Optional
from fastapi import UploadFile, HTTPException

from app.config import settings

logger = logging.getLogger("prcj.image")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 50  # Allow large 8K images (up to 50MB)

# Cloudinary transformation presets
TRANSFORMS = {
    "thumbnail": "c_fill,w_400,h_400,q_auto,f_auto",
    "medium": "c_fill,w_800,h_800,q_auto,f_auto",
    "large": "c_limit,w_2000,q_auto,f_auto",
    "original": "q_auto,f_auto",
}


def _get_cloudinary():
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return cloudinary


def _derive_url(base_url: str, transform: str) -> str:
    """Swap the default upload transform into the Cloudinary URL."""
    return base_url.replace("/upload/", f"/upload/{transform}/")


async def upload_product_image(
    file: UploadFile,
    product_id: str,
    folder: Optional[str] = None,
) -> dict:
    # Validate type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported image type: {file.content_type}")

    data = await file.read()

    if len(data) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Image too large. Max {MAX_FILE_SIZE_MB}MB.")

    if not settings.CLOUDINARY_CLOUD_NAME:
        # Dev fallback — return dummy URLs
        logger.warning("Cloudinary not configured — using placeholder image URLs")
        placeholder = "https://via.placeholder.com/800x800.png?text=PRCJ"
        return {
            "url": placeholder,
            "thumbnail_url": placeholder,
            "medium_url": placeholder,
            "public_id": "placeholder",
        }

    try:
        cloudinary = _get_cloudinary()
        import cloudinary.uploader

        upload_folder = folder or f"{settings.CLOUDINARY_FOLDER}/products/{product_id}"
        result = cloudinary.uploader.upload(
            data,
            folder=upload_folder,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            resource_type="image",
            # Store original at full quality for 8K
            transformation=[{"quality": "auto", "fetch_format": "auto"}],
            eager=[
                {"width": 400, "height": 400, "crop": "fill", "quality": "auto", "fetch_format": "auto"},
                {"width": 800, "height": 800, "crop": "fill", "quality": "auto", "fetch_format": "auto"},
            ],
            eager_async=True,
        )

        original_url = result["secure_url"]
        eager = result.get("eager", [])

        return {
            "url": original_url,
            "thumbnail_url": eager[0]["secure_url"] if len(eager) > 0 else _derive_url(original_url, TRANSFORMS["thumbnail"]),
            "medium_url": eager[1]["secure_url"] if len(eager) > 1 else _derive_url(original_url, TRANSFORMS["medium"]),
            "public_id": result["public_id"],
        }
    except Exception as e:
        logger.error("Cloudinary upload failed: %s", e)
        raise HTTPException(500, "Image upload failed. Please try again.")


async def delete_image(public_id: str) -> bool:
    if not settings.CLOUDINARY_CLOUD_NAME:
        return True
    try:
        cloudinary = _get_cloudinary()
        import cloudinary.uploader
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error("Cloudinary delete failed for %s: %s", public_id, e)
        return False


async def upload_review_image(file: UploadFile, review_id: str) -> str:
    result = await upload_product_image(
        file, review_id, folder=f"{settings.CLOUDINARY_FOLDER}/reviews/{review_id}"
    )
    return result["medium_url"] or result["url"]
