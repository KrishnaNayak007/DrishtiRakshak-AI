"""
CURRENT IMPLEMENTATION: the glue between the model-agnostic detection/risk
modules and the Django ORM. This is intentionally the *only* place that
imports both `evidence`/`incidents` models and the detection layer — keeps
the detection package testable in isolation (no DB required to unit test
risk.py's math).
"""

from evidence.models import Evidence, TimelineEvent
from incidents.models import Incident

from detection.risk import score_frames
from detection.service import detect_video


def process_evidence(evidence: Evidence) -> Incident:
    """
    Runs detection + heuristic risk scoring on an Evidence video and
    persists the results as TimelineEvents + one Incident. Locks the
    evidence afterward so it can't be silently modified post-analysis.
    """
    frame_detections = detect_video(evidence.video_file.path)
    assessment = score_frames(frame_detections)

    for event in assessment.events:
        TimelineEvent.objects.create(
            evidence=evidence,
            timestamp_offset_seconds=event.timestamp_seconds,
            event_type=event.event_type,
            confidence=event.confidence,
            description=event.description,
        )

    incident, _ = Incident.objects.update_or_create(
        evidence=evidence,
        defaults={"risk_score": assessment.risk_score, "summary": assessment.summary},
    )

    evidence.processed = True
    evidence.save(update_fields=["processed"])
    evidence.lock()

    return incident
