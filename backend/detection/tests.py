from django.test import TestCase
import pytest
from detection.interface import FrameDetections, Detection
from detection.risk import score_frames


def test_sustained_proximity_scoring_logic():
    """
    Test that the risk engine calculates sustained proximity correctly
    without requiring a database connection or migrations [12].
    """
    # Simulate 5 frames over 4 seconds where a motorcycle is constantly present
    mock_frames = [
        FrameDetections(frame_index=0, timestamp=0.0, detections=[
            Detection(label="motorcycle", confidence=0.90, box_xyxy=(10, 20, 100, 200))
        ]),
        FrameDetections(frame_index=10, timestamp=1.0, detections=[
            Detection(label="motorcycle", confidence=0.88, box_xyxy=(12, 22, 105, 205))
        ]),
        FrameDetections(frame_index=20, timestamp=2.0, detections=[
            Detection(label="motorcycle", confidence=0.85, box_xyxy=(15, 25, 110, 210))
        ]),
        FrameDetections(frame_index=30, timestamp=3.0, detections=[
            Detection(label="motorcycle", confidence=0.92, box_xyxy=(18, 28, 115, 215))
        ]),
        FrameDetections(frame_index=40, timestamp=4.0, detections=[
            Detection(label="motorcycle", confidence=0.91, box_xyxy=(20, 30, 120, 220))
        ])
    ]

    assessment = score_frames(mock_frames)

    # Validate that sustained proximity triggered
    event_types = [e.event_type for e in assessment.events]
    assert "sustained_proximity" in event_types
    assert assessment.risk_score > 0.40  # Must represent elevated risk
    assert "sustained proximity of a motorcycle" in assessment.summary.lower()