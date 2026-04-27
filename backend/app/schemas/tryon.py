import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator


# ── 3D Model Schemas ──────────────────────────────────────────────────────────

class AnchorOffset(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class MaterialProperties(BaseModel):
    metalness: float = 0.9
    roughness: float = 0.1
    envMapIntensity: float = 1.5
    emissiveIntensity: float = 0.0
    clearcoat: float = 0.3
    clearcoatRoughness: float = 0.1


class Product3DModelOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    glb_url: str
    usdz_url: Optional[str]
    preview_render_url: Optional[str]
    placement_type: str
    anchor_offset: Dict[str, float]
    scale_x: float
    scale_y: float
    scale_z: float
    rotation_x: float
    rotation_y: float
    rotation_z: float
    landmark_indices: List[int]
    material_properties: Dict[str, Any]
    lighting_preset: str
    is_active: bool
    polygon_count: Optional[int]

    model_config = {"from_attributes": True}


class Product3DModelCreate(BaseModel):
    """Used by admin to register metadata after uploading a GLB file."""
    placement_type: str
    anchor_offset: Dict[str, float] = {"x": 0.0, "y": 0.0, "z": 0.0}
    scale_x: float = 1.0
    scale_y: float = 1.0
    scale_z: float = 1.0
    rotation_x: float = 0.0
    rotation_y: float = 0.0
    rotation_z: float = 0.0
    landmark_indices: List[int] = []
    material_properties: Dict[str, Any] = {}
    lighting_preset: str = "gold"
    polygon_count: Optional[int] = None


# ── Try-On Session Schemas ────────────────────────────────────────────────────

class LandmarkPoint(BaseModel):
    """A single 3D landmark point returned by MediaPipe."""
    x: float     # normalised 0.0 – 1.0 (left→right)
    y: float     # normalised 0.0 – 1.0 (top→bottom)
    z: float     # relative depth — negative = closer to camera
    visibility: Optional[float] = None


class DetectedLandmarks(BaseModel):
    """
    Full landmark detection result from a user's image/webcam frame.
    Contains all relevant landmark groups for every jewelry type.
    """
    # Face mesh landmarks (MediaPipe 468-point face mesh)
    face_landmarks: Optional[List[LandmarkPoint]] = None

    # Pose landmarks (MediaPipe 33-point body pose)
    pose_landmarks: Optional[List[LandmarkPoint]] = None

    # Hand landmarks — left + right (MediaPipe 21 points each)
    left_hand_landmarks: Optional[List[LandmarkPoint]] = None
    right_hand_landmarks: Optional[List[LandmarkPoint]] = None

    # Computed anchor points (calculated by the service from raw landmarks)
    necklace_anchor: Optional[LandmarkPoint] = None
    left_ear_anchor: Optional[LandmarkPoint] = None
    right_ear_anchor: Optional[LandmarkPoint] = None
    left_ring_anchor: Optional[LandmarkPoint] = None
    right_ring_anchor: Optional[LandmarkPoint] = None
    left_wrist_anchor: Optional[LandmarkPoint] = None
    right_wrist_anchor: Optional[LandmarkPoint] = None
    maang_tikka_anchor: Optional[LandmarkPoint] = None
    nose_anchor: Optional[LandmarkPoint] = None
    left_upper_arm_anchor: Optional[LandmarkPoint] = None
    right_upper_arm_anchor: Optional[LandmarkPoint] = None
    waist_anchor: Optional[LandmarkPoint] = None
    left_ankle_anchor: Optional[LandmarkPoint] = None
    right_ankle_anchor: Optional[LandmarkPoint] = None

    # Computed scale factors (distance between landmarks used for sizing)
    face_width_norm: Optional[float] = None      # left_ear → right_ear
    shoulder_width_norm: Optional[float] = None  # left_shoulder → right_shoulder
    wrist_width_norm: Optional[float] = None     # wrist bounding box width
    finger_length_norm: Optional[float] = None   # knuckle → fingertip


class TryOnSessionCreate(BaseModel):
    product_id: uuid.UUID
    input_mode: str = "webcam"   # webcam | upload
    device_type: Optional[str] = None


class TryOnSessionOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    model_3d: Optional[Product3DModelOut]
    status: str
    landmark_data: Optional[Dict[str, Any]]
    user_adjustments: Optional[Dict[str, Any]]
    screenshots: List[str]
    input_mode: Optional[str]
    device_type: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class DetectLandmarksRequest(BaseModel):
    """
    Frontend sends a base64-encoded image frame to detect landmarks.
    """
    session_id: uuid.UUID
    image_base64: str     # base64 PNG/JPEG frame from webcam or uploaded photo
    frame_width: int
    frame_height: int


class DetectLandmarksResponse(BaseModel):
    session_id: uuid.UUID
    landmarks: DetectedLandmarks
    placement_type: str
    model_config_override: Optional[Dict[str, Any]] = None
    # Confidence score 0.0 – 1.0 for detection quality
    detection_confidence: float


class SaveScreenshotRequest(BaseModel):
    session_id: uuid.UUID
    image_base64: str     # base64 PNG composite (photo + 3D overlay)
    user_adjustments: Optional[Dict[str, Any]] = None


class SaveScreenshotResponse(BaseModel):
    screenshot_url: str
    session_id: uuid.UUID


class UserAdjustmentUpdate(BaseModel):
    """User drags, pinches, rotates the 3D model — persist their tweaks."""
    session_id: uuid.UUID
    scale: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None
    rotation_y: Optional[float] = None
    rotation_x: Optional[float] = None


# ── Product Image Schemas ─────────────────────────────────────────────────────

class ProductImageDetailOut(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: Optional[str]
    medium_url: Optional[str]
    large_url: Optional[str]
    zoom_url: Optional[str]
    alt_text: Optional[str]
    image_type: str
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}
