import uuid
from enum import Enum as PyEnum
from sqlalchemy import (
    String, Boolean, Enum, Text, ForeignKey,
    Float, Index, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class JewelryPlacementType(str, PyEnum):
    """Defines where on the body a 3D model anchors during AR try-on."""
    necklace       = "necklace"       # neck / collarbone
    earring        = "earring"        # ear lobes (left + right)
    ring           = "ring"           # finger knuckle
    bangle         = "bangle"         # wrist
    maang_tikka    = "maang_tikka"    # forehead / hairline centre
    nath           = "nath"           # nose tip / nostril
    haathphool     = "haathphool"     # back of hand + fingers
    payal          = "payal"          # ankle
    bajuband       = "bajuband"       # upper arm
    brooch         = "brooch"         # chest / lapel
    kamarband      = "kamarband"      # waist
    chain          = "chain"          # neck / chest (men)
    kada           = "kada"           # wrist (men)


class TryOnStatus(str, PyEnum):
    active    = "active"
    completed = "completed"
    abandoned = "abandoned"


class Product3DModel(Base):
    """
    GLB/GLTF + USDZ 3D model for a product, used in AR/WebGL virtual try-on.
    Each product can have one active 3D model per placement type.
    """
    __tablename__ = "product_3d_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ── Model files ──────────────────────────────────────────────────────────
    glb_url: Mapped[str] = mapped_column(Text, nullable=False)     # WebGL / Android AR
    usdz_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # iOS AR Quick Look
    preview_render_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # Static 3D preview image

    # ── Placement config ─────────────────────────────────────────────────────
    placement_type: Mapped[JewelryPlacementType] = mapped_column(
        Enum(JewelryPlacementType, name="jewelryplacementtype"), nullable=False
    )

    # Anchor offsets relative to detected landmark (normalised 0.0–1.0)
    # e.g. {"x": 0.0, "y": -0.05, "z": 0.02}
    anchor_offset: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=lambda: {"x": 0.0, "y": 0.0, "z": 0.0}
    )

    # Initial scale relative to landmark bounding box
    scale_x: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    scale_y: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    scale_z: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Euler rotation offsets in degrees
    rotation_x: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rotation_y: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rotation_z: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Which MediaPipe landmarks to anchor to (JSON array of landmark indices)
    # e.g. necklace → [10, 152, 234, 454] (forehead + chin + cheeks for scale)
    landmark_indices: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list
    )

    # Physics / material properties for realistic rendering
    material_properties: Mapped[dict] = mapped_column(
        JSONB, nullable=True,
        default=lambda: {
            "metalness": 0.9,
            "roughness": 0.1,
            "envMapIntensity": 1.5,
            "emissiveIntensity": 0.0,
            "clearcoat": 0.3,
            "clearcoatRoughness": 0.1,
        }
    )

    # Lighting preset for this material (gold | silver | kundan | diamond | polki)
    lighting_preset: Mapped[str] = mapped_column(String(50), default="gold", nullable=False)

    # True if this is the primary/best model for this product
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # File sizes (bytes) — stored for asset management
    glb_size_bytes: Mapped[int | None] = mapped_column(nullable=True)
    polygon_count: Mapped[int | None] = mapped_column(nullable=True)

    cloudinary_public_id: Mapped[str | None] = mapped_column(String(300), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="models_3d")

    __table_args__ = (
        UniqueConstraint("product_id", "placement_type", name="uq_product_placement_type"),
        Index("ix_3d_models_product_active", "product_id", "is_active"),
    )


class TryOnSession(Base):
    """
    Tracks a user's virtual try-on session.
    Stores detected landmarks + screenshots so users can revisit or share.
    """
    __tablename__ = "tryon_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )
    model_3d_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_3d_models.id", ondelete="SET NULL"),
        nullable=True
    )

    status: Mapped[TryOnStatus] = mapped_column(
        Enum(TryOnStatus, name="tryonstatus"),
        default=TryOnStatus.active, nullable=False
    )

    # Detected MediaPipe landmark data for this session
    # Stored so the frontend can replay or resume without re-detecting
    landmark_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Placement adjustments the user made manually (drag/pinch/rotate)
    user_adjustments: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True,
        # e.g. {"scale": 1.2, "offset_x": 0.02, "offset_y": -0.01, "rotation_y": 5.0}
    )

    # Saved screenshot(s) from the try-on
    screenshots: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    # Device / input mode
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # mobile | desktop | tablet
    input_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)   # webcam | upload

    product: Mapped["Product"] = relationship("Product")
    model_3d: Mapped["Product3DModel | None"] = relationship("Product3DModel")

    __table_args__ = (
        Index("ix_tryon_user_product", "user_id", "product_id"),
    )
