"""
Virtual Try-On service using MediaPipe for body + face landmark detection.

Supports all Indian jewelry placement types:
  necklace, earring, ring, bangle, maang_tikka, nath,
  haathphool, payal, bajuband, brooch, kamarband, chain, kada

Landmark detection pipeline:
  1. Decode base64 image frame
  2. Run MediaPipe FaceMesh (468 points) for head/face jewelry
  3. Run MediaPipe Pose (33 points) for body jewelry
  4. Run MediaPipe Hands (21 points × 2) for hand/wrist jewelry
  5. Compute derived anchor points per jewelry type
  6. Return structured DetectedLandmarks for the frontend renderer
"""
import base64
import io
import logging
from typing import Optional

import numpy as np

from app.schemas.tryon import DetectedLandmarks, LandmarkPoint
from app.models.tryon import JewelryPlacementType

logger = logging.getLogger("prcj.tryon")


# ── MediaPipe landmark index constants ────────────────────────────────────────

# FaceMesh indices (subset of the 468-point model)
FM = {
    "NOSE_TIP":         4,
    "NOSE_BOTTOM":      2,
    "LEFT_EAR_TOP":     356,
    "LEFT_EAR_LOBE":    365,
    "RIGHT_EAR_TOP":    127,
    "RIGHT_EAR_LOBE":   136,
    "CHIN":             152,
    "FOREHEAD_TOP":     10,
    "FOREHEAD_LEFT":    103,
    "FOREHEAD_RIGHT":   332,
    "HAIRLINE_CENTER":  10,
    "LEFT_CHEEK":       234,
    "RIGHT_CHEEK":      454,
    # Necklace collarbone approximation via face bottom landmarks
    "THROAT_CENTER":    152,
    # Nose piercing anchor
    "LEFT_NOSTRIL":     129,
    "RIGHT_NOSTRIL":    358,
    "NOSE_TIP_TRI":     19,
}

# Pose landmarks (MediaPipe 33-point)
POSE = {
    "NOSE":               0,
    "LEFT_SHOULDER":     11,
    "RIGHT_SHOULDER":    12,
    "LEFT_ELBOW":        13,
    "RIGHT_ELBOW":       14,
    "LEFT_WRIST":        15,
    "RIGHT_WRIST":       16,
    "LEFT_HIP":          23,
    "RIGHT_HIP":         24,
    "LEFT_ANKLE":        27,
    "RIGHT_ANKLE":       28,
}

# Hand landmarks (MediaPipe 21-point per hand)
HAND = {
    "WRIST":            0,
    "THUMB_CMC":        1,
    "INDEX_MCP":        5,    # knuckle — ring placement base
    "MIDDLE_MCP":       9,
    "RING_MCP":        13,    # ring finger base
    "PINKY_MCP":       17,
    "INDEX_TIP":        8,
    "RING_TIP":        16,
    "MIDDLE_TIP":      12,
}


def _mp_point(lm) -> LandmarkPoint:
    """Convert MediaPipe NormalizedLandmark → LandmarkPoint."""
    return LandmarkPoint(
        x=float(lm.x),
        y=float(lm.y),
        z=float(lm.z),
        visibility=float(getattr(lm, "visibility", 1.0)),
    )


def _midpoint(a: LandmarkPoint, b: LandmarkPoint) -> LandmarkPoint:
    return LandmarkPoint(
        x=(a.x + b.x) / 2,
        y=(a.y + b.y) / 2,
        z=(a.z + b.z) / 2,
    )


def _dist(a: LandmarkPoint, b: LandmarkPoint) -> float:
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


def _decode_image(image_base64: str) -> np.ndarray:
    """Decode base64 PNG/JPEG to BGR numpy array (OpenCV format)."""
    import cv2
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image.")
    return img


async def detect_landmarks(
    image_base64: str,
    placement_type: JewelryPlacementType,
) -> tuple[DetectedLandmarks, float]:
    """
    Run MediaPipe detection and return structured landmarks + confidence.

    Returns:
        (DetectedLandmarks, detection_confidence 0.0–1.0)
    """
    try:
        import mediapipe as mp
        import cv2
    except ImportError:
        logger.warning("MediaPipe/OpenCV not installed. Returning stub landmarks.")
        return _stub_landmarks(placement_type), 0.0

    img_bgr = _decode_image(image_base64)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    h, w = img_bgr.shape[:2]

    result = DetectedLandmarks()
    confidence = 0.0

    needs_face  = placement_type in (
        JewelryPlacementType.earring,
        JewelryPlacementType.necklace,
        JewelryPlacementType.maang_tikka,
        JewelryPlacementType.nath,
        JewelryPlacementType.chain,
    )
    needs_pose  = placement_type in (
        JewelryPlacementType.necklace,
        JewelryPlacementType.chain,
        JewelryPlacementType.brooch,
        JewelryPlacementType.bajuband,
        JewelryPlacementType.kamarband,
        JewelryPlacementType.payal,
    )
    needs_hands = placement_type in (
        JewelryPlacementType.ring,
        JewelryPlacementType.bangle,
        JewelryPlacementType.kada,
        JewelryPlacementType.haathphool,
    )

    # ── FaceMesh ─────────────────────────────────────────────────────────────
    if needs_face:
        with mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        ) as face_mesh:
            fm_result = face_mesh.process(img_rgb)

        if fm_result.multi_face_landmarks:
            lms = fm_result.multi_face_landmarks[0].landmark
            result.face_landmarks = [_mp_point(lm) for lm in lms]
            confidence = max(confidence, 0.9)

            # Compute derived anchors from face landmarks
            left_lobe  = _mp_point(lms[FM["LEFT_EAR_LOBE"]])
            right_lobe = _mp_point(lms[FM["RIGHT_EAR_LOBE"]])
            left_top   = _mp_point(lms[FM["LEFT_EAR_TOP"]])
            right_top  = _mp_point(lms[FM["RIGHT_EAR_TOP"]])
            chin       = _mp_point(lms[FM["CHIN"]])
            forehead   = _mp_point(lms[FM["HAIRLINE_CENTER"]])
            nose_tip   = _mp_point(lms[FM["NOSE_TIP"]])
            nose_bot   = _mp_point(lms[FM["NOSE_BOTTOM"]])
            left_cheek = _mp_point(lms[FM["LEFT_CHEEK"]])
            right_cheek= _mp_point(lms[FM["RIGHT_CHEEK"]])

            result.left_ear_anchor  = left_lobe
            result.right_ear_anchor = right_lobe
            result.face_width_norm  = _dist(left_cheek, right_cheek)

            # Maang tikka — midpoint between hairline and forehead centre
            result.maang_tikka_anchor = LandmarkPoint(
                x=(forehead.x + _mp_point(lms[FM["FOREHEAD_LEFT"]]).x + _mp_point(lms[FM["FOREHEAD_RIGHT"]]).x) / 3,
                y=forehead.y - 0.02,   # slightly above hairline
                z=forehead.z,
            )

            # Nath — right nostril for traditional nose ring
            result.nose_anchor = _mp_point(lms[FM["RIGHT_NOSTRIL"]])

            # Necklace collarbone — extrapolate below chin
            face_height = _dist(forehead, chin)
            result.necklace_anchor = LandmarkPoint(
                x=(left_lobe.x + right_lobe.x) / 2,
                y=chin.y + face_height * 0.35,  # ~35% below chin = collarbone
                z=chin.z + 0.03,
            )

    # ── Pose ─────────────────────────────────────────────────────────────────
    if needs_pose:
        with mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=0.5,
        ) as pose:
            pose_result = pose.process(img_rgb)

        if pose_result.pose_landmarks:
            plms = pose_result.pose_landmarks.landmark
            result.pose_landmarks = [_mp_point(lm) for lm in plms]
            confidence = max(confidence, 0.85)

            left_sh  = _mp_point(plms[POSE["LEFT_SHOULDER"]])
            right_sh = _mp_point(plms[POSE["RIGHT_SHOULDER"]])
            left_hip = _mp_point(plms[POSE["LEFT_HIP"]])
            right_hip= _mp_point(plms[POSE["RIGHT_HIP"]])
            left_ank = _mp_point(plms[POSE["LEFT_ANKLE"]])
            right_ank= _mp_point(plms[POSE["RIGHT_ANKLE"]])
            left_elb = _mp_point(plms[POSE["LEFT_ELBOW"]])
            right_elb= _mp_point(plms[POSE["RIGHT_ELBOW"]])

            result.shoulder_width_norm = _dist(left_sh, right_sh)

            # Necklace override from pose (more reliable for body shots)
            sh_mid = _midpoint(left_sh, right_sh)
            result.necklace_anchor = LandmarkPoint(
                x=sh_mid.x,
                y=sh_mid.y - 0.04,  # just above shoulder midpoint = collarbone
                z=sh_mid.z,
            )

            # Brooch — centre chest below collarbone
            hip_mid = _midpoint(left_hip, right_hip)
            result.waist_anchor = LandmarkPoint(
                x=hip_mid.x, y=hip_mid.y, z=hip_mid.z
            )

            # Bajuband — upper arm midpoint
            result.left_upper_arm_anchor  = _midpoint(left_sh, left_elb)
            result.right_upper_arm_anchor = _midpoint(right_sh, right_elb)

            # Payal
            result.left_ankle_anchor  = left_ank
            result.right_ankle_anchor = right_ank

    # ── Hands ─────────────────────────────────────────────────────────────────
    if needs_hands:
        with mp.solutions.hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.5,
        ) as hands:
            hand_result = hands.process(img_rgb)

        if hand_result.multi_hand_landmarks:
            confidence = max(confidence, 0.88)
            for idx, hand_lms in enumerate(hand_result.multi_hand_landmarks):
                hlms = hand_lms.landmark
                pts = [_mp_point(lm) for lm in hlms]

                handedness = (
                    hand_result.multi_handedness[idx].classification[0].label
                    if hand_result.multi_handedness else "Right"
                )

                wrist    = _mp_point(hlms[HAND["WRIST"]])
                ring_mcp = _mp_point(hlms[HAND["RING_MCP"]])
                ring_tip = _mp_point(hlms[HAND["RING_TIP"]])
                idx_mcp  = _mp_point(hlms[HAND["INDEX_MCP"]])

                # Ring finger length for scale
                result.finger_length_norm = _dist(ring_mcp, ring_tip)
                # Wrist width approximation
                result.wrist_width_norm = _dist(
                    _mp_point(hlms[HAND["THUMB_CMC"]]),
                    _mp_point(hlms[HAND["PINKY_MCP"]]),
                )

                # Ring anchor — ring finger MCP joint (base knuckle)
                if handedness == "Left":
                    result.left_hand_landmarks = pts
                    result.left_ring_anchor    = ring_mcp
                    result.left_wrist_anchor   = wrist
                else:
                    result.right_hand_landmarks = pts
                    result.right_ring_anchor    = ring_mcp
                    result.right_wrist_anchor   = wrist

    return result, min(confidence, 1.0)


def _stub_landmarks(placement_type: JewelryPlacementType) -> DetectedLandmarks:
    """
    Returns plausible placeholder landmarks when MediaPipe is not installed.
    Used in development/testing without the full ML dependency stack.
    """
    centre = LandmarkPoint(x=0.5, y=0.5, z=0.0)
    result = DetectedLandmarks()

    if placement_type in (JewelryPlacementType.necklace, JewelryPlacementType.chain):
        result.necklace_anchor = LandmarkPoint(x=0.5, y=0.68, z=0.0)
    elif placement_type == JewelryPlacementType.earring:
        result.left_ear_anchor  = LandmarkPoint(x=0.25, y=0.55, z=0.0)
        result.right_ear_anchor = LandmarkPoint(x=0.75, y=0.55, z=0.0)
    elif placement_type in (JewelryPlacementType.ring, JewelryPlacementType.haathphool):
        result.right_ring_anchor = LandmarkPoint(x=0.6, y=0.7, z=0.0)
        result.right_wrist_anchor = LandmarkPoint(x=0.55, y=0.78, z=0.0)
        result.finger_length_norm = 0.12
        result.wrist_width_norm = 0.18
    elif placement_type in (JewelryPlacementType.bangle, JewelryPlacementType.kada):
        result.right_wrist_anchor = LandmarkPoint(x=0.55, y=0.78, z=0.0)
        result.wrist_width_norm = 0.18
    elif placement_type == JewelryPlacementType.maang_tikka:
        result.maang_tikka_anchor = LandmarkPoint(x=0.5, y=0.22, z=0.0)
    elif placement_type == JewelryPlacementType.nath:
        result.nose_anchor = LandmarkPoint(x=0.57, y=0.52, z=0.0)
    elif placement_type == JewelryPlacementType.bajuband:
        result.left_upper_arm_anchor  = LandmarkPoint(x=0.28, y=0.50, z=0.0)
        result.right_upper_arm_anchor = LandmarkPoint(x=0.72, y=0.50, z=0.0)
    elif placement_type == JewelryPlacementType.payal:
        result.left_ankle_anchor  = LandmarkPoint(x=0.38, y=0.92, z=0.0)
        result.right_ankle_anchor = LandmarkPoint(x=0.62, y=0.92, z=0.0)
    elif placement_type == JewelryPlacementType.kamarband:
        result.waist_anchor = LandmarkPoint(x=0.5, y=0.72, z=0.0)

    result.face_width_norm      = 0.48
    result.shoulder_width_norm  = 0.52
    return result


# ── Placement config defaults ─────────────────────────────────────────────────

PLACEMENT_DEFAULTS: dict[JewelryPlacementType, dict] = {
    JewelryPlacementType.necklace: {
        "landmark_indices": [10, 152, 234, 454, 365, 136],
        "anchor_offset": {"x": 0.0, "y": 0.05, "z": 0.02},
        "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0,
        "rotation_x": -10.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.earring: {
        "landmark_indices": [365, 136, 356, 127],
        "anchor_offset": {"x": 0.0, "y": 0.01, "z": 0.0},
        "scale_x": 0.8, "scale_y": 0.8, "scale_z": 0.8,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.ring: {
        "landmark_indices": [13, 16],
        "anchor_offset": {"x": 0.0, "y": -0.01, "z": 0.0},
        "scale_x": 0.6, "scale_y": 0.6, "scale_z": 0.6,
        "rotation_x": 0.0, "rotation_y": 90.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.bangle: {
        "landmark_indices": [15, 16],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.1, "scale_y": 1.1, "scale_z": 1.1,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.maang_tikka: {
        "landmark_indices": [10, 103, 332],
        "anchor_offset": {"x": 0.0, "y": -0.02, "z": 0.01},
        "scale_x": 0.7, "scale_y": 0.7, "scale_z": 0.7,
        "rotation_x": 5.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "kundan",
    },
    JewelryPlacementType.nath: {
        "landmark_indices": [358, 129, 4],
        "anchor_offset": {"x": 0.01, "y": 0.005, "z": 0.02},
        "scale_x": 0.4, "scale_y": 0.4, "scale_z": 0.4,
        "rotation_x": 0.0, "rotation_y": -15.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.haathphool: {
        "landmark_indices": [0, 5, 9, 13, 17],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.payal: {
        "landmark_indices": [27, 28],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "silver",
    },
    JewelryPlacementType.bajuband: {
        "landmark_indices": [11, 13, 12, 14],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.kamarband: {
        "landmark_indices": [23, 24],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.2, "scale_y": 1.2, "scale_z": 1.2,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.chain: {
        "landmark_indices": [10, 152, 11, 12],
        "anchor_offset": {"x": 0.0, "y": 0.04, "z": 0.02},
        "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0,
        "rotation_x": -8.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.kada: {
        "landmark_indices": [15, 16],
        "anchor_offset": {"x": 0.0, "y": 0.0, "z": 0.0},
        "scale_x": 1.2, "scale_y": 1.2, "scale_z": 1.2,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "gold",
    },
    JewelryPlacementType.brooch: {
        "landmark_indices": [11, 12],
        "anchor_offset": {"x": -0.08, "y": 0.08, "z": 0.0},
        "scale_x": 0.6, "scale_y": 0.6, "scale_z": 0.6,
        "rotation_x": 0.0, "rotation_y": 0.0, "rotation_z": 0.0,
        "lighting_preset": "kundan",
    },
}
