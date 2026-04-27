"""
Seed script for PRCJ Jewellery — Indian Jewelry Collections.
Includes: categories, products with 8+ images per item, 3D model configs.

Run: python -m scripts.seed_data
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine, Base
from app.models.category import Category, Collection, GenderTarget
from app.models.product import Product, ProductImage, MetalType, ProductStatus, ImageType
from app.models.tryon import Product3DModel, JewelryPlacementType
from app.models.user import User, UserRole
from app.core.security import hash_password

import uuid
from decimal import Decimal


# ── Cloudinary placeholder URLs (replaced by real uploads in production) ───────
#
#  Format: https://res.cloudinary.com/{cloud}/image/upload/{transform}/prcj/{sku}/{type}.jpg
#  We simulate multiple angles per product.
#
def _img(sku: str, angle: str, w: int = 7680, h: int = 4320) -> str:
    """Placeholder 8K image URL — swap with real Cloudinary URLs in production."""
    return f"https://placehold.co/{w}x{h}/1a0a00/ffd700?text=PRCJ+{sku}+{angle}"

def _thumb(sku: str, angle: str) -> str:
    return f"https://placehold.co/400x400/1a0a00/ffd700?text={sku}+{angle}"

def _medium(sku: str, angle: str) -> str:
    return f"https://placehold.co/800x800/1a0a00/ffd700?text={sku}+{angle}"

def _large(sku: str, angle: str) -> str:
    return f"https://placehold.co/2000x2000/1a0a00/ffd700?text={sku}+{angle}"

def _zoom(sku: str, angle: str) -> str:
    return f"https://placehold.co/4000x4000/1a0a00/ffd700?text={sku}+{angle}"


def _make_images(sku: str, product_name: str) -> list[dict]:
    """
    Generate a full set of 8+ images for a jewelry product covering:
      front 8K, side 8K, back 8K, 3 detail/macro shots, on-model lifestyle,
      on-model face/hand close-up, packaging, and hallmark certificate.
    """
    return [
        {
            "image_type": ImageType.front_8k,
            "url": _img(sku, "Front"),
            "thumbnail_url": _thumb(sku, "Front"),
            "medium_url": _medium(sku, "Front"),
            "large_url": _large(sku, "Front"),
            "zoom_url": _zoom(sku, "Front"),
            "alt_text": f"{product_name} — Front View",
            "is_primary": True,
            "sort_order": 0,
        },
        {
            "image_type": ImageType.side_8k,
            "url": _img(sku, "Side-L"),
            "thumbnail_url": _thumb(sku, "Side-L"),
            "medium_url": _medium(sku, "Side-L"),
            "large_url": _large(sku, "Side-L"),
            "zoom_url": _zoom(sku, "Side-L"),
            "alt_text": f"{product_name} — Left Side",
            "is_primary": False,
            "sort_order": 1,
        },
        {
            "image_type": ImageType.back_8k,
            "url": _img(sku, "Back"),
            "thumbnail_url": _thumb(sku, "Back"),
            "medium_url": _medium(sku, "Back"),
            "large_url": _large(sku, "Back"),
            "zoom_url": _zoom(sku, "Back"),
            "alt_text": f"{product_name} — Back / Clasp",
            "is_primary": False,
            "sort_order": 2,
        },
        {
            "image_type": ImageType.detail_macro,
            "url": _img(sku, "Macro", 7680, 7680),
            "thumbnail_url": _thumb(sku, "Macro"),
            "medium_url": _medium(sku, "Macro"),
            "large_url": _large(sku, "Macro"),
            "zoom_url": _zoom(sku, "Macro"),
            "alt_text": f"{product_name} — Macro Detail",
            "is_primary": False,
            "sort_order": 3,
        },
        {
            "image_type": ImageType.detail_stone,
            "url": _img(sku, "Stone", 7680, 7680),
            "thumbnail_url": _thumb(sku, "Stone"),
            "medium_url": _medium(sku, "Stone"),
            "large_url": _large(sku, "Stone"),
            "zoom_url": _zoom(sku, "Stone"),
            "alt_text": f"{product_name} — Gemstone Detail",
            "is_primary": False,
            "sort_order": 4,
        },
        {
            "image_type": ImageType.detail_finish,
            "url": _img(sku, "Finish", 7680, 7680),
            "thumbnail_url": _thumb(sku, "Finish"),
            "medium_url": _medium(sku, "Finish"),
            "large_url": _large(sku, "Finish"),
            "zoom_url": _zoom(sku, "Finish"),
            "alt_text": f"{product_name} — Gold Finish Detail",
            "is_primary": False,
            "sort_order": 5,
        },
        {
            "image_type": ImageType.on_model,
            "url": _img(sku, "OnModel", 4320, 7680),
            "thumbnail_url": _thumb(sku, "OnModel"),
            "medium_url": _medium(sku, "OnModel"),
            "large_url": _large(sku, "OnModel"),
            "zoom_url": _zoom(sku, "OnModel"),
            "alt_text": f"{product_name} — Worn on Model",
            "is_primary": False,
            "sort_order": 6,
        },
        {
            "image_type": ImageType.on_model_face,
            "url": _img(sku, "Face", 4320, 4320),
            "thumbnail_url": _thumb(sku, "Face"),
            "medium_url": _medium(sku, "Face"),
            "large_url": _large(sku, "Face"),
            "zoom_url": _zoom(sku, "Face"),
            "alt_text": f"{product_name} — Close-up on Model",
            "is_primary": False,
            "sort_order": 7,
        },
        {
            "image_type": ImageType.lifestyle,
            "url": _img(sku, "Lifestyle", 7680, 4320),
            "thumbnail_url": _thumb(sku, "Lifestyle"),
            "medium_url": _medium(sku, "Lifestyle"),
            "large_url": _large(sku, "Lifestyle"),
            "zoom_url": None,
            "alt_text": f"{product_name} — Lifestyle",
            "is_primary": False,
            "sort_order": 8,
        },
        {
            "image_type": ImageType.packaging,
            "url": _img(sku, "Box", 4000, 4000),
            "thumbnail_url": _thumb(sku, "Box"),
            "medium_url": _medium(sku, "Box"),
            "large_url": _large(sku, "Box"),
            "zoom_url": None,
            "alt_text": f"{product_name} — Gift Box",
            "is_primary": False,
            "sort_order": 9,
        },
        {
            "image_type": ImageType.certificate,
            "url": _img(sku, "Certificate", 2480, 3508),
            "thumbnail_url": _thumb(sku, "Cert"),
            "medium_url": _medium(sku, "Cert"),
            "large_url": _large(sku, "Cert"),
            "zoom_url": None,
            "alt_text": f"{product_name} — BIS Hallmark Certificate",
            "is_primary": False,
            "sort_order": 10,
        },
    ]


# ── 3D model default configs per jewelry placement type ───────────────────────

def _make_3d_model(
    placement_type: JewelryPlacementType,
    lighting_preset: str = "gold",
    polygon_count: int = 85000,
) -> dict:
    from app.services.tryon import PLACEMENT_DEFAULTS
    defaults = PLACEMENT_DEFAULTS.get(placement_type, {})
    return {
        "placement_type": placement_type,
        "glb_url": f"https://placeholder.prcj.in/models/{placement_type.value}.glb",
        "usdz_url": f"https://placeholder.prcj.in/models/{placement_type.value}.usdz",
        "preview_render_url": f"https://placehold.co/800x800/1a0a00/ffd700?text=3D+{placement_type.value}",
        "anchor_offset": defaults.get("anchor_offset", {"x": 0.0, "y": 0.0, "z": 0.0}),
        "scale_x": defaults.get("scale_x", 1.0),
        "scale_y": defaults.get("scale_y", 1.0),
        "scale_z": defaults.get("scale_z", 1.0),
        "rotation_x": defaults.get("rotation_x", 0.0),
        "rotation_y": defaults.get("rotation_y", 0.0),
        "rotation_z": defaults.get("rotation_z", 0.0),
        "landmark_indices": defaults.get("landmark_indices", []),
        "material_properties": {
            "metalness": 0.95 if "gold" in lighting_preset else 0.7,
            "roughness": 0.08 if "gold" in lighting_preset else 0.15,
            "envMapIntensity": 1.8,
            "emissiveIntensity": 0.0,
            "clearcoat": 0.4,
            "clearcoatRoughness": 0.1,
        },
        "lighting_preset": lighting_preset,
        "is_active": True,
        "polygon_count": polygon_count,
        "cloudinary_public_id": f"prcj/models/{placement_type.value}",
    }


# ── Category Tree ─────────────────────────────────────────────────────────────

CATEGORY_TREE = {
    "women": {
        "Necklaces & Haars": [
            "Choker Necklace", "Mangalsutra", "Rani Haar", "Bridal Haar",
            "Temple Necklace", "Meenakari Necklace", "Kundan Necklace",
            "Polki Necklace", "Jadau Necklace", "Layered Necklace", "Coin Necklace",
        ],
        "Earrings": [
            "Jhumka", "Chandbali", "Bali (Hoops)", "Studs", "Dangler Earrings",
            "Ear Chain Earrings", "Meenakari Earrings", "Kundan Earrings",
            "Temple Earrings", "Long Earrings",
        ],
        "Bangles & Kadas": [
            "Gold Bangles", "Silver Bangles", "Kundan Bangles", "Meenakari Bangles",
            "Antique Bangles", "Diamond Bangles", "Gold Kada", "Silver Kada",
        ],
        "Rings": [
            "Engagement Ring", "Solitaire Ring", "Cocktail Ring", "Toe Ring",
            "Kundan Ring", "Meenakari Ring", "Adjustable Ring",
        ],
        "Maang Tikka": [
            "Kundan Maang Tikka", "Polki Maang Tikka", "Diamond Maang Tikka",
            "Gold Maang Tikka", "Passa (Side Tikka)",
        ],
        "Nath (Nose Ring)": [
            "Nose Ring with Chain", "Stud Nath", "Bridal Nath", "Meenakari Nath",
        ],
        "Payal (Anklet)": [
            "Silver Payal", "Gold Payal", "Beaded Payal", "Ghungroo Payal",
        ],
        "Haathphool": [
            "Gold Haathphool", "Kundan Haathphool", "Meenakari Haathphool",
        ],
        "Kamarband (Waist Belt)": [
            "Gold Kamarband", "Silver Kamarband", "Kundan Kamarband",
        ],
        "Bajuband (Armlet)": [
            "Gold Bajuband", "Kundan Bajuband", "Temple Bajuband",
        ],
    },
    "men": {
        "Chains & Necklaces": [
            "Gold Chain", "Silver Chain", "Rudraksha Mala", "Temple Chain", "Link Chain",
        ],
        "Rings": [
            "Gold Ring", "Silver Ring", "Diamond Ring", "Navratna Ring", "Signet Ring",
        ],
        "Kadas & Bracelets": [
            "Gold Kada", "Silver Kada", "Diamond Bracelet", "Rudraksha Bracelet",
        ],
        "Earrings": ["Gold Bali (Hoops)", "Silver Bali", "Stud Earrings"],
        "Brooches & Pins": ["Gold Brooch", "Kundan Brooch", "Sherwani Brooch"],
        "Cufflinks": ["Gold Cufflinks", "Diamond Cufflinks", "Silver Cufflinks"],
    },
    "bridal": {
        "Bridal Sets": [
            "Complete Bridal Set", "Kundan Bridal Set", "Polki Bridal Set",
            "Diamond Bridal Set", "Gold Bridal Set", "Temple Bridal Set",
        ],
        "Regional Bridal": [
            "Rajasthani Bridal Set", "Bengali Bridal Set (Shankha Pola)",
            "South Indian Bridal Set", "Punjabi Bridal Set",
            "Maharashtrian Bridal Set (Nath & Tanmani)", "Hyderabadi Bridal Set",
            "Kashmiri Bridal Set", "Gujarati Bridal Set",
        ],
        "Bridal Necklaces": [
            "Bridal Rani Haar", "Bridal Choker", "Bridal Mangalsutra", "Bridal Jadau Necklace",
        ],
        "Bridal Headpieces": [
            "Bridal Maang Tikka", "Passa Set", "Mathapatti", "Matha Patti with Tikka",
        ],
        "Bridal Accessories": [
            "Bridal Nath", "Bridal Haathphool", "Bridal Kamarband",
            "Bridal Bajuband", "Bridal Payal",
        ],
    },
    "unisex": {
        "22K Gold Jewelry": [], "18K Gold Jewelry": [], "Silver Jewelry": [],
        "Kundan Jewelry": [], "Polki Jewelry": [], "Jadau Jewelry": [],
        "Meenakari Jewelry": [], "Temple Jewelry": [], "Diamond Jewelry": [],
        "Navratna Jewelry": [], "Antique Jewelry": [], "Oxidised Silver": [],
    },
    "kids": {
        "Kids Bangles": [],
        "Kids Earrings": ["Kids Gold Studs", "Kids Jhumka", "Kids Bali"],
        "Kids Rings": ["Gold Ring for Kids", "Silver Ring for Kids"],
        "Kids Chains": ["Gold Chain for Kids", "Silver Chain for Kids"],
    },
}


# ── Products ──────────────────────────────────────────────────────────────────
#  Each product includes:
#  - Full jewelry metadata
#  - 11 images (front 8K, side, back, 3×detail/macro, on-model, face-close-up,
#    lifestyle, packaging, certificate)
#  - 3D model config with MediaPipe placement anchors

SAMPLE_PRODUCTS = [
    {
        "name": "Kundan Bridal Choker Necklace Set",
        "sku": "PRCJ-KUN-001",
        "description": (
            "Exquisite handcrafted Kundan bridal choker necklace set featuring uncut diamonds "
            "and precious gemstones in 22K gold setting. A timeless piece crafted by our master "
            "artisans from Jaipur. Includes matching earrings and maang tikka. Each stone is "
            "hand-set in the traditional Rajasthani style using centuries-old Kundan technique. "
            "The necklace features 7 layers of detailed gold filigree work with emerald drops "
            "and ruby accents. Weight approximately 98.5 grams."
        ),
        "short_description": "Handcrafted Kundan bridal set with uncut diamonds in 22K gold",
        "price": Decimal("185000.00"), "sale_price": Decimal("165000.00"),
        "metal_type": MetalType.kundan, "weight_gm": 98.5, "purity": "22K BIS Hallmark",
        "stone_details": "Uncut diamonds, Ruby, Emerald, Kundan setting",
        "making_charges": Decimal("25000.00"), "stock": 3,
        "is_featured": True, "is_new_arrival": False, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.9, "review_count": 47,
        "category_key": "Complete Bridal Set",
        "placement_type": JewelryPlacementType.necklace,
        "lighting_preset": "kundan", "polygon_count": 120000,
    },
    {
        "name": "Traditional Rajasthani Jhumka Earrings",
        "sku": "PRCJ-JHM-001",
        "description": (
            "Authentic Rajasthani jhumka earrings with intricate meenakari work. "
            "These statement earrings feature vibrant enamel in traditional peacock motifs, "
            "surrounded by fresh water pearls and kundan stones in gold-plated silver. "
            "Each jhumka measures 8cm in length — perfect for bridal, festive, and traditional wear. "
            "The peacock motif is hand-painted by artisans from Jaipur's Johri Bazaar. "
            "The bell cluster at the bottom creates a delicate sound with each movement."
        ),
        "short_description": "Meenakari jhumka with hand-painted peacock motifs and pearl drops",
        "price": Decimal("8500.00"), "sale_price": Decimal("7200.00"),
        "metal_type": MetalType.meenakari, "weight_gm": 22.3,
        "purity": "Gold Plated 92.5 Silver",
        "stone_details": "Fresh water pearls, Kundan, Enamel meenakari",
        "making_charges": Decimal("1500.00"), "stock": 25,
        "is_featured": True, "is_new_arrival": True, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.7, "review_count": 132,
        "category_key": "Jhumka",
        "placement_type": JewelryPlacementType.earring,
        "lighting_preset": "kundan", "polygon_count": 65000,
    },
    {
        "name": "22K Gold Mangalsutra with Diamond Pendant",
        "sku": "PRCJ-MNG-001",
        "description": (
            "Elegant 22K gold mangalsutra featuring a stunning pendant with VS1 diamonds "
            "and black beads. A modern-traditional design that can be worn daily. "
            "The pendant measures 2.5cm × 1.8cm with 0.45ct of round brilliant VS1 diamonds "
            "set in 22K yellow gold. The black glass beads are machine-cut for uniform appearance. "
            "Comes with BIS Hallmark 916 certification and GIA diamond grading report."
        ),
        "short_description": "22K hallmark gold mangalsutra with VS1 diamond pendant",
        "price": Decimal("68000.00"), "sale_price": None,
        "metal_type": MetalType.gold_22k, "weight_gm": 12.8, "purity": "22K BIS Hallmark 916",
        "stone_details": "0.45ct VS1 diamonds (GIA certified), Black glass beads",
        "making_charges": Decimal("8000.00"), "stock": 8,
        "is_featured": True, "is_new_arrival": True, "is_best_seller": False,
        "status": ProductStatus.active, "avg_rating": 4.8, "review_count": 89,
        "category_key": "Mangalsutra",
        "placement_type": JewelryPlacementType.necklace,
        "lighting_preset": "gold", "polygon_count": 75000,
    },
    {
        "name": "Royal Polki Diamond Bridal Haar",
        "sku": "PRCJ-PLK-001",
        "description": (
            "Royal Polki diamond haar in 22K yellow gold with uncut diamonds, rubies and emeralds "
            "in a traditional Mughal-inspired design. Handcrafted by our Hyderabadi master goldsmiths "
            "using the authentic Jadau technique — where stones are set in pure gold without any base metal. "
            "This 5-layered haar contains 8 carats of natural Polki diamonds with vivid lustre, "
            "complemented by pigeon-blood rubies from Burma and Colombian emeralds. "
            "The total piece weight is 185 grams. Comes in a premium wooden rosewood jewellery box."
        ),
        "short_description": "Mughal-inspired Polki diamond Haar with Burmese rubies and Colombian emeralds",
        "price": Decimal("425000.00"), "sale_price": None,
        "metal_type": MetalType.polki, "weight_gm": 185.0, "purity": "22K BIS Hallmark",
        "stone_details": "8ct Polki diamonds, Pigeon-blood Ruby (Burma), Colombian Emerald, Pearl drops",
        "making_charges": Decimal("65000.00"), "stock": 1,
        "is_featured": True, "is_new_arrival": False, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 5.0, "review_count": 12,
        "category_key": "Polki Bridal Set",
        "placement_type": JewelryPlacementType.necklace,
        "lighting_preset": "polki", "polygon_count": 180000,
    },
    {
        "name": "South Indian Temple Gold Necklace — Lakshmi Motif",
        "sku": "PRCJ-TMP-001",
        "description": (
            "Traditional South Indian temple necklace featuring Goddess Lakshmi "
            "and elaborate temple architecture motifs. Crafted in 22K gold with a rich antique matte finish. "
            "The centrepiece shows Goddess Lakshmi in seated position surrounded by lotus flowers, "
            "flanked by two peacocks. Ruby and emerald accent stones in traditional Kerala style. "
            "Perfect for Bharatanatyam performances, temple visits, and South Indian wedding ceremonies. "
            "Measurements: 45cm total length, pendant 6cm × 5cm."
        ),
        "short_description": "22K gold South Indian temple necklace with Goddess Lakshmi motif",
        "price": Decimal("95000.00"), "sale_price": Decimal("88000.00"),
        "metal_type": MetalType.temple, "weight_gm": 55.2, "purity": "22K BIS Hallmark 916",
        "stone_details": "Natural Ruby, Emerald, Coral — traditional South Indian",
        "making_charges": Decimal("18000.00"), "stock": 5,
        "is_featured": True, "is_new_arrival": False, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.9, "review_count": 63,
        "category_key": "Temple Necklace",
        "placement_type": JewelryPlacementType.necklace,
        "lighting_preset": "gold", "polygon_count": 95000,
    },
    {
        "name": "Filigree Oxidised Silver Chandbali Earrings",
        "sku": "PRCJ-OXD-001",
        "description": (
            "Handcrafted oxidised silver chandbali earrings with intricate filigree work "
            "and turquoise stone drops. Made using the centuries-old Odisha filigree tradition "
            "(Tarakasi craft) by GI-certified artisans from Cuttack. "
            "Each earring is crafted from 92.5 sterling silver wire, twisted and shaped by hand "
            "into the crescent moon (Chandbali) form. The turquoise drops are natural Arizona turquoise. "
            "Lightweight at 18.5g — perfect for all-day wear."
        ),
        "short_description": "Tarakasi filigree oxidised silver chandbali with natural turquoise drops",
        "price": Decimal("2800.00"), "sale_price": Decimal("2200.00"),
        "metal_type": MetalType.oxidised, "weight_gm": 18.5,
        "purity": "92.5 Sterling Silver, GI-certified Tarakasi craft",
        "stone_details": "Natural Arizona Turquoise",
        "making_charges": Decimal("600.00"), "stock": 40,
        "is_featured": False, "is_new_arrival": True, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.6, "review_count": 215,
        "category_key": "Chandbali",
        "placement_type": JewelryPlacementType.earring,
        "lighting_preset": "silver", "polygon_count": 55000,
    },
    {
        "name": "Men's Heavy 22K Gold Kada",
        "sku": "PRCJ-KDA-M-001",
        "description": (
            "Heavy men's 22K gold kada with traditional Punjabi-style engravings. "
            "A symbol of strength and tradition, crafted in hallmark 22K gold. "
            "The outer surface features intricate floral and geometric engravings by hand. "
            "The inner surface is smooth and polished for comfortable all-day wear. "
            "Available in sizes Small (inner diameter 6.5cm), Medium (7cm), Large (7.5cm). "
            "Ideal for wedding ceremonies, festivals, and gifting on special occasions."
        ),
        "short_description": "Heavy 22K hallmark gold kada — hand-engraved Punjabi style",
        "price": Decimal("125000.00"), "sale_price": None,
        "metal_type": MetalType.gold_22k, "weight_gm": 62.5, "purity": "22K BIS Hallmark 916",
        "stone_details": None, "making_charges": Decimal("15000.00"), "stock": 4,
        "is_featured": True, "is_new_arrival": False, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.8, "review_count": 28,
        "category_key": "Gold Kada",
        "placement_type": JewelryPlacementType.kada,
        "lighting_preset": "gold", "polygon_count": 60000,
    },
    {
        "name": "Certified Navratna Pendant in 18K Gold",
        "sku": "PRCJ-NAV-001",
        "description": (
            "Auspicious navratna pendant featuring the nine sacred gemstones in 18K gold — "
            "representing the nine planets (Navagrahas). Stones: diamond (sun), natural pearl (moon), "
            "red coral (Mars), emerald (Mercury), yellow sapphire (Jupiter), "
            "diamond/white sapphire (Venus), blue sapphire (Saturn), hessonite garnet (Rahu), "
            "and cat's eye chrysoberyl (Ketu). All stones are individually certified. "
            "The pendant measures 2.2cm × 2.2cm. Comes with a detailed astrological significance card."
        ),
        "short_description": "Certified navratna pendant — 9 planet gemstones in 18K gold",
        "price": Decimal("42000.00"), "sale_price": Decimal("38000.00"),
        "metal_type": MetalType.navratna, "weight_gm": 8.2, "purity": "18K Gold",
        "stone_details": "Diamond, Natural Pearl, Red Coral, Emerald, Yellow Sapphire, Blue Sapphire, Hessonite, Cat's Eye — all certified",
        "making_charges": Decimal("5000.00"), "stock": 12,
        "is_featured": True, "is_new_arrival": True, "is_best_seller": False,
        "status": ProductStatus.active, "avg_rating": 4.7, "review_count": 34,
        "category_key": "Navratna Jewelry",
        "placement_type": JewelryPlacementType.necklace,
        "lighting_preset": "diamond", "polygon_count": 85000,
    },
    {
        "name": "Jadau Kundan Maang Tikka with Pearl Chain",
        "sku": "PRCJ-TKK-001",
        "description": (
            "Elaborate Jadau Kundan maang tikka with cascading pearl chain. "
            "The centrepiece features a large oval uncut diamond (Polki) surrounded by Kundan-set rubies, "
            "with a teardrop emerald drop. The matha patti (forehead chain) is set with smaller Kundan stones "
            "and drapes elegantly to both sides. Handcrafted in Jaipur using the traditional Jadau technique "
            "where gold is hammered around each stone — no prongs, no glue, purely mechanical setting."
        ),
        "short_description": "Jadau Kundan maang tikka with Polki centrepiece and pearl matha patti",
        "price": Decimal("55000.00"), "sale_price": Decimal("49000.00"),
        "metal_type": MetalType.jadau, "weight_gm": 35.5, "purity": "22K BIS Hallmark",
        "stone_details": "Polki diamond, Kundan, Ruby, Emerald, Fresh water pearls",
        "making_charges": Decimal("12000.00"), "stock": 6,
        "is_featured": True, "is_new_arrival": True, "is_best_seller": False,
        "status": ProductStatus.active, "avg_rating": 4.9, "review_count": 41,
        "category_key": "Kundan Maang Tikka",
        "placement_type": JewelryPlacementType.maang_tikka,
        "lighting_preset": "kundan", "polygon_count": 90000,
    },
    {
        "name": "Silver Ghungroo Payal (Anklet)",
        "sku": "PRCJ-PAY-001",
        "description": (
            "Traditional sterling silver ghungroo payal with 28 hand-assembled ghungroos (bells). "
            "Each ghungroo is individually soldered to the main chain for durability. "
            "The anklet features an intricate floral pattern along the main band with "
            "delicate patta (leaf) motifs at intervals. Suitable for Bharatanatyam, "
            "Kathak, and classical dance performances as well as everyday traditional wear. "
            "Total length: 25cm. Closure: S-hook with 3-position adjuster for perfect fit."
        ),
        "short_description": "92.5 sterling silver payal with 28 traditional ghungroo bells",
        "price": Decimal("3500.00"), "sale_price": Decimal("3000.00"),
        "metal_type": MetalType.silver, "weight_gm": 28.0, "purity": "92.5 BIS Hallmarked Silver",
        "stone_details": None, "making_charges": Decimal("800.00"), "stock": 30,
        "is_featured": False, "is_new_arrival": True, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.8, "review_count": 178,
        "category_key": "Ghungroo Payal",
        "placement_type": JewelryPlacementType.payal,
        "lighting_preset": "silver", "polygon_count": 45000,
    },
    {
        "name": "Bridal Meenakari Nath with Gold Chain",
        "sku": "PRCJ-NTH-001",
        "description": (
            "Grand bridal Rajasthani nath featuring vibrant meenakari enamel work on 22K gold. "
            "The nath is 5cm in diameter with a traditional peacock design in blue and green meenakari, "
            "surrounded by table-cut diamonds and natural rubies. The gold chain (latkan) connects "
            "to a hair-clip for secure wearing without ear piercing. A centrepiece piece for "
            "Rajasthani and Marwari bridal looks. Made by 4th-generation meenakari artisans from Jaipur."
        ),
        "short_description": "22K gold bridal Rajasthani nath with meenakari peacock design",
        "price": Decimal("28000.00"), "sale_price": None,
        "metal_type": MetalType.meenakari, "weight_gm": 18.0, "purity": "22K BIS Hallmark",
        "stone_details": "Table-cut diamonds, Natural Ruby, Meenakari enamel",
        "making_charges": Decimal("6000.00"), "stock": 8,
        "is_featured": True, "is_new_arrival": False, "is_best_seller": True,
        "status": ProductStatus.active, "avg_rating": 4.8, "review_count": 55,
        "category_key": "Bridal Nath",
        "placement_type": JewelryPlacementType.nath,
        "lighting_preset": "gold", "polygon_count": 70000,
    },
    {
        "name": "Kundan Gold Haathphool (Hand Harness)",
        "sku": "PRCJ-HPL-001",
        "description": (
            "Intricate Kundan gold haathphool (hand harness / pacheli) connecting wrist bangle "
            "to five finger rings via delicate gold chains with Kundan flower motifs. "
            "Each finger ring is adjustable (one-size fits most). The wrist piece features a "
            "large central Kundan medallion with ruby drops and emerald accents. "
            "A statement bridal accessory that adds drama and elegance to any bridal look. "
            "Also available in silver and pearl variations."
        ),
        "short_description": "Kundan gold haathphool with adjustable finger rings and emerald accents",
        "price": Decimal("22000.00"), "sale_price": Decimal("19500.00"),
        "metal_type": MetalType.kundan, "weight_gm": 42.0, "purity": "Gold Plated 22K",
        "stone_details": "Kundan, Ruby, Emerald",
        "making_charges": Decimal("4500.00"), "stock": 10,
        "is_featured": True, "is_new_arrival": True, "is_best_seller": False,
        "status": ProductStatus.active, "avg_rating": 4.7, "review_count": 67,
        "category_key": "Gold Haathphool",
        "placement_type": JewelryPlacementType.haathphool,
        "lighting_preset": "kundan", "polygon_count": 110000,
    },
]


COLLECTIONS_DATA = [
    {"name": "Bridal Season 2025", "slug": "bridal-season-2025",
     "description": "The most exquisite bridal jewellery collection for the 2025 wedding season.",
     "is_featured": True, "sort_order": 1},
    {"name": "Navratri Special", "slug": "navratri-special-2025",
     "description": "Celebrate Navratri with our vibrant traditional jewellery.",
     "is_featured": True, "sort_order": 2},
    {"name": "Diwali Gold Collection", "slug": "diwali-gold-2025",
     "description": "Pure gold jewellery curated for Dhanteras and Diwali gifting.",
     "is_featured": True, "sort_order": 3},
    {"name": "Temple Jewellery", "slug": "temple-jewellery",
     "description": "Traditional South Indian temple jewellery for dance and ceremonies.",
     "is_featured": False, "sort_order": 4},
    {"name": "New Arrivals", "slug": "new-arrivals",
     "description": "The latest additions to the PRCJ catalogue.",
     "is_featured": True, "sort_order": 5},
    {"name": "Virtual Try-On Collection", "slug": "virtual-tryon",
     "description": "Products with 3D virtual try-on enabled — see how they look on you.",
     "is_featured": True, "sort_order": 6},
    {"name": "Under ₹10,000", "slug": "under-10000",
     "description": "Beautiful jewellery that won't break the bank.",
     "is_featured": False, "sort_order": 7},
    {"name": "Men's Finest", "slug": "mens-finest",
     "description": "Curated men's gold and silver jewellery for every occasion.",
     "is_featured": True, "sort_order": 8},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("🌱 Seeding PRCJ Jewellery database...")

        # ── Categories ────────────────────────────────────────────────────────
        print("  → Creating category tree...")
        gender_map = {
            "women": GenderTarget.women, "men": GenderTarget.men,
            "bridal": GenderTarget.bridal, "unisex": GenderTarget.unisex,
            "kids": GenderTarget.kids,
        }
        category_lookup: dict[str, Category] = {}

        for gender_key, subcats in CATEGORY_TREE.items():
            gender = gender_map[gender_key]
            for i, (parent_name, children) in enumerate(subcats.items()):
                parent_slug = (
                    parent_name.lower()
                    .replace(" ", "-").replace("(", "").replace(")", "")
                    .replace("&", "and").replace("/", "-").replace("'", "")
                )
                parent_slug = f"{gender_key}-{parent_slug}"
                parent_cat = Category(
                    name=parent_name, slug=parent_slug,
                    gender=gender, sort_order=i, is_active=True,
                )
                db.add(parent_cat)
                await db.flush()
                category_lookup[parent_name] = parent_cat

                for j, child_name in enumerate(children):
                    child_slug = (
                        child_name.lower()
                        .replace(" ", "-").replace("(", "").replace(")", "")
                        .replace("&", "and").replace("/", "-").replace("'", "")
                    )
                    child_slug = f"{parent_slug}-{child_slug}"
                    child_cat = Category(
                        name=child_name, slug=child_slug,
                        gender=gender, parent_id=parent_cat.id,
                        sort_order=j, is_active=True,
                    )
                    db.add(child_cat)
                    category_lookup[child_name] = child_cat

        await db.flush()
        print(f"  ✅ {len(category_lookup)} categories created.")

        # ── Products with rich images + 3D models ─────────────────────────────
        print("  → Creating products with 11 images + 3D model each...")
        products_created = []

        for p_data in SAMPLE_PRODUCTS:
            cat_key = p_data.pop("category_key")
            placement_type = p_data.pop("placement_type")
            lighting_preset = p_data.pop("lighting_preset")
            polygon_count = p_data.pop("polygon_count")

            cat = category_lookup.get(cat_key)
            if not cat:
                cat = list(category_lookup.values())[0]

            slug = (
                p_data["name"].lower()
                .replace(" ", "-").replace(",", "").replace("'", "")
                .replace("(", "").replace(")", "").replace("—", "")
                .replace("  ", "-")
            )

            product = Product(
                slug=slug,
                category_id=cat.id,
                has_3d_model=True,
                **{k: v for k, v in p_data.items() if k not in ("category_key",)},
            )
            db.add(product)
            await db.flush()

            # 11 images per product
            for img_data in _make_images(product.sku, product.name):
                db.add(ProductImage(product_id=product.id, **img_data))

            # 3D model
            m3d_data = _make_3d_model(placement_type, lighting_preset, polygon_count)
            db.add(Product3DModel(product_id=product.id, **m3d_data))

            products_created.append(product)

        await db.flush()
        print(f"  ✅ {len(products_created)} products × 11 images + 3D model each = "
              f"{len(products_created) * 11} images, {len(products_created)} 3D models.")

        # ── Collections ───────────────────────────────────────────────────────
        print("  → Creating curated collections...")
        for c_data in COLLECTIONS_DATA:
            db.add(Collection(**c_data, is_active=True))
        await db.flush()
        print(f"  ✅ {len(COLLECTIONS_DATA)} collections.")

        await db.commit()
        print("\n✨ PRCJ seed complete!")
        print(f"   Categories : {len(category_lookup)}")
        print(f"   Products   : {len(products_created)}")
        print(f"   Images     : {len(products_created) * 11} (11 per product, 8K resolution)")
        print(f"   3D Models  : {len(products_created)} (GLB + USDZ per product)")
        print(f"   Collections: {len(COLLECTIONS_DATA)}")
        print("\n   All products have virtual try-on 3D models enabled. ✓")


if __name__ == "__main__":
    asyncio.run(seed())
