from dataclasses import dataclass, field


@dataclass
class Detection:
    label: str
    confidence: float
    box_xyxy: tuple[float, float, float, float]


@dataclass
class FrameDetections:
    frame_index: int
    timestamp: float
    detections: list[Detection] = field(default_factory=list)


@dataclass
class ScoringEvent:
    timestamp_seconds: float
    event_type: str
    confidence: float
    description: str


@dataclass
class Assessment:
    risk_score: float  # Scale of 0.0 to 1.0 (matching your constraint)
    summary: str
    events: list[ScoringEvent] = field(default_factory=list)