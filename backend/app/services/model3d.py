"""
3D model upload service for PRCJ Virtual Try-On.

Handles GLB / GLTF / USDZ model files:
 - Upload to Cloudinary raw resource type (preserves binary)
 - Validate file type, size, polygon count (via pygltflib)
 - Generate a static preview render URL
 - Return structured result for Product3DModel record creation
"""
import io
import base64
import logging
from typing import Optional
from fastapi import UploadFile, HTTPException

from app.config import settings

logger = logging.getLogger("prcj.model3d")

ALLOWED_3D_TYPES = {
    "model/gltf-binary": ".glb",
    "model/gltf+json": ".gltf",
    "model/vnd.usdz+zip": ".usdz",
    "application/octet-stream": ".glb",   # browsers sometimes report GLB as this
}

MAX_3D_SIZE_MB = 100   # 100MB cap for high-detail 3D jewelry models
MAX_POLYGON_COUNT = 2_000_000  # 2M polys max for real-time WebGL rendering


def _get_cloudinary():
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return cloudinary


def _validate_glb(data: bytes) -> Optional[int]:
    """
    Validate GLB binary and return approximate polygon count.
    Returns None if pygltflib is not available.
    """
    try:
        import pygltflib
        from pygltflib import GLTF2
        import struct

        gltf = GLTF2.load_from_bytes(data)

        total_polys = 0
        for mesh in gltf.meshes:
            for prim in mesh.primitives:
                if prim.indices is not None:
                    acc = gltf.accessors[prim.indices]
                    total_polys += acc.count // 3
        return total_polys or None
    except Exception as e:
        logger.debug("pygltflib validation skipped: %s", e)
        return None


async def upload_glb_model(
    file: UploadFile,
    product_id: str,
    placement_type: str,
) -> dict:
    """
    Upload a GLB/GLTF/USDZ model to Cloudinary and return metadata.

    Returns:
        {
            "glb_url": str,
            "usdz_url": str | None,
            "preview_render_url": str | None,
            "cloudinary_public_id": str,
            "glb_size_bytes": int,
            "polygon_count": int | None,
            "file_extension": str,
        }
    """
    # Type check
    content_type = file.content_type or "application/octet-stream"
    ext = ALLOWED_3D_TYPES.get(content_type)
    if not ext:
        # Fallback: check filename extension
        filename = file.filename or ""
        if filename.endswith(".glb"):
            ext = ".glb"
        elif filename.endswith(".gltf"):
            ext = ".gltf"
        elif filename.endswith(".usdz"):
            ext = ".usdz"
        else:
            raise HTTPException(
                400,
                f"Unsupported 3D model format. Supported: GLB, GLTF, USDZ. Got: {content_type}",
            )

    data = await file.read()
    size_bytes = len(data)

    if size_bytes > MAX_3D_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"3D model too large. Max {MAX_3D_SIZE_MB}MB.")

    # Validate GLB + get polygon count
    polygon_count = None
    if ext in (".glb", ".gltf"):
        polygon_count = _validate_glb(data)
        if polygon_count and polygon_count > MAX_POLYGON_COUNT:
            raise HTTPException(
                400,
                f"Model has {polygon_count:,} polygons — max {MAX_POLYGON_COUNT:,} for real-time AR. "
                "Please optimise the mesh (use Blender Decimate or Draco compression).",
            )

    if not settings.CLOUDINARY_CLOUD_NAME:
        logger.warning("Cloudinary not configured — returning placeholder 3D model URLs")
        return {
            "glb_url": f"https://placeholder.prcj.in/models/{product_id}/{placement_type}.glb",
            "usdz_url": f"https://placeholder.prcj.in/models/{product_id}/{placement_type}.usdz",
            "preview_render_url": f"https://via.placeholder.com/800x800.png?text=3D+{placement_type}",
            "cloudinary_public_id": f"placeholder_{product_id}",
            "glb_size_bytes": size_bytes,
            "polygon_count": polygon_count,
            "file_extension": ext,
        }

    try:
        cloudinary = _get_cloudinary()
        import cloudinary.uploader

        folder = f"{settings.CLOUDINARY_FOLDER}/models/{product_id}"
        public_id = f"{folder}/{placement_type}{ext}"

        # Upload as raw resource (binary preserved)
        result = cloudinary.uploader.upload(
            data,
            resource_type="raw",
            public_id=public_id,
            overwrite=True,
            invalidate=True,
        )

        glb_url = result["secure_url"]

        # Generate a preview render using Cloudinary 3D transformation
        # (Cloudinary supports GLB → PNG render for supported tiers)
        preview_url = None
        if ext == ".glb":
            try:
                from cloudinary import CloudinaryImage
                preview_url = CloudinaryImage(result["public_id"]).build_url(
                    resource_type="image",
                    format="png",
                    transformation=[
                        {"width": 800, "height": 800, "crop": "fill"},
                        {"background": "transparent"},
                    ],
                )
            except Exception:
                pass

        return {
            "glb_url": glb_url,
            "usdz_url": None,  # USDZ can be a separate upload
            "preview_render_url": preview_url,
            "cloudinary_public_id": result["public_id"],
            "glb_size_bytes": size_bytes,
            "polygon_count": polygon_count,
            "file_extension": ext,
        }

    except Exception as e:
        logger.error("Cloudinary 3D model upload failed: %s", e)
        raise HTTPException(500, "3D model upload failed. Please try again.")


async def upload_usdz_model(
    file: UploadFile,
    product_id: str,
    placement_type: str,
) -> str:
    """Upload a USDZ file (iOS AR) and return its CDN URL."""
    data = await file.read()

    if not settings.CLOUDINARY_CLOUD_NAME:
        return f"https://placeholder.prcj.in/models/{product_id}/{placement_type}.usdz"

    cloudinary = _get_cloudinary()
    import cloudinary.uploader

    folder = f"{settings.CLOUDINARY_FOLDER}/models/{product_id}"
    result = cloudinary.uploader.upload(
        data,
        resource_type="raw",
        public_id=f"{folder}/{placement_type}_ios.usdz",
        overwrite=True,
    )
    return result["secure_url"]


async def save_tryon_screenshot(
    image_base64: str,
    session_id: str,
    product_id: str,
) -> str:
    """
    Upload a try-on composite screenshot (photo + 3D overlay) to Cloudinary.
    Returns the CDN URL.
    """
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    data = base64.b64decode(image_base64)

    if not settings.CLOUDINARY_CLOUD_NAME:
        return f"https://placeholder.prcj.in/tryon/{session_id}/screenshot.png"

    cloudinary = _get_cloudinary()
    import cloudinary.uploader

    folder = f"{settings.CLOUDINARY_FOLDER}/tryon/{product_id}"
    result = cloudinary.uploader.upload(
        data,
        resource_type="image",
        folder=folder,
        public_id=f"session_{session_id}_{len(data)}",
        overwrite=True,
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return result["secure_url"]
