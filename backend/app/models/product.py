import uuid
from enum import Enum as PyEnum
from decimal import Decimal
from sqlalchemy import (
    String, Boolean, Enum, Text, ForeignKey, Integer,
    Numeric, Index, Table, Column, Float, CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB

from app.database import Base


class ImageType(str, PyEnum):
    """Categorises what each product image shows."""
    front_8k       = "front_8k"        # Hero shot — full front, 8K resolution
    side_8k        = "side_8k"         # 90° side view, 8K
    back_8k        = "back_8k"         # Rear / clasp detail, 8K
    detail_macro   = "detail_macro"    # Extreme close-up — stone, engraving, setting
    detail_clasp   = "detail_clasp"    # Clasp / lock / hook mechanism
    detail_stone   = "detail_stone"    # Gemstone close-up
    detail_finish  = "detail_finish"   # Finish / texture detail
    on_model       = "on_model"        # Worn on a model (body shot)
    on_model_face  = "on_model_face"   # Worn — face / neck / ears close-up
    on_model_hand  = "on_model_hand"   # Worn on hand / wrist
    lifestyle      = "lifestyle"       # Styled flat-lay / lifestyle setting
    packaging      = "packaging"       # Gift box / pouch presentation
    certificate    = "certificate"     # Hallmark / gemstone certificate
    size_reference = "size_reference"  # On ruler / size guide card
    view_360       = "360_view"        # Frame from 360° spin set


class MetalType(str, PyEnum):
    gold_22k = "22K Gold"
    gold_18k = "18K Gold"
    gold_14k = "14K Gold"
    silver = "Silver"
    platinum = "Platinum"
    kundan = "Kundan"
    polki = "Polki"
    jadau = "Jadau"
    meenakari = "Meenakari"
    temple = "Temple Gold"
    navratna = "Navratna"
    diamond = "Diamond"
    rose_gold = "Rose Gold"
    antique = "Antique Gold"
    oxidised = "Oxidised Silver"


class ProductStatus(str, PyEnum):
    draft = "draft"
    active = "active"
    archived = "archived"
    out_of_stock = "out_of_stock"


# Many-to-many: Product ↔ Collection
collection_products = Table(
    "collection_products",
    Base.metadata,
    Column("collection_id", UUID(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(350), unique=True, index=True, nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Pricing
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sale_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Physical specs
    metal_type: Mapped[MetalType] = mapped_column(
        Enum(MetalType, name="metaltype"), nullable=False
    )
    weight_gm: Mapped[float | None] = mapped_column(Float, nullable=True)
    purity: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. "BIS Hallmark 916"
    stone_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    making_charges: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Stock
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, name="productstatus"), default=ProductStatus.draft, nullable=False
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_new_arrival: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_best_seller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # SEO
    meta_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Aggregates (denormalised for performance)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan",
        order_by="ProductImage.sort_order"
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="product")
    collections: Mapped[list["Collection"]] = relationship(
        "Collection", secondary=collection_products, back_populates="products"
    )
    models_3d: Mapped[list["Product3DModel"]] = relationship(
        "Product3DModel", back_populates="product", cascade="all, delete-orphan"
    )
    has_3d_model: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_product_price_positive"),
        CheckConstraint("stock >= 0", name="ck_product_stock_non_negative"),
        Index("ix_products_status_featured", "status", "is_featured"),
        Index("ix_products_category_status", "category_id", "status"),
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)                        # Full 8K CDN URL
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)        # 400px thumb
    medium_url: Mapped[str | None] = mapped_column(Text, nullable=True)           # 800px medium
    large_url: Mapped[str | None] = mapped_column(Text, nullable=True)            # 2000px — product page zoom
    zoom_url: Mapped[str | None] = mapped_column(Text, nullable=True)             # 4000px — deep zoom / loupe
    alt_text: Mapped[str | None] = mapped_column(String(300), nullable=True)
    image_type: Mapped[ImageType] = mapped_column(
        Enum(ImageType, name="imagetype"),
        default=ImageType.front_8k, nullable=False
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # EXIF / camera metadata stored for traceability of 8K originals
    exif_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="images")


class ProductVariant(Base):
    """Size/metal variants of a product with independent pricing & stock."""

    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Size 12 – 22K Gold"
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metal_type: Mapped[MetalType | None] = mapped_column(
        Enum(MetalType, name="metaltype"), nullable=True
    )
    price_modifier: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sku_suffix: Mapped[str | None] = mapped_column(String(50), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
