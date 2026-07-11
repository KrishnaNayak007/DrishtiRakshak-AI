"""
CURRENT IMPLEMENTATION: the stable contract between "whatever CV model we use"
and the rest of the app. Nothing outside this module should import ultralytics,
opencv, or any model-specific code directly — that's the whole point of the
boundary. Swapping YOLOv8 for something else later means editing service.py
only.

PLANNED: add audio/OCR result types here once those are wired in (Month 2+).
FUTURE VISION: this is where a real "Vision Agent" structured-output contract
would live if the multi-agent architecture is ever actually built.
"""

from dataclasses import dataclass, field


@dataclass
class Detection:
    label: str            # e.g. "car", "motorcycle", "person"
    confidence: float      # 0.0-1.0
    box_xyxy: tuple[float, float, float, float]  # pixel coords in the source frame


@dataclass
class FrameDetections:
    frame_index: int
    timestamp_seconds: float
    detections: list[Detection] = field(default_factory=list)
