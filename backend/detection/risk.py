"""
CURRENT IMPLEMENTATION: a deliberately simple, fully explainable heuristic.
This is NOT a "Threat Assessment Agent" — it's a weighted rule you can read
top to bottom and verify by hand against a video. That's the point: every
number this produces must be traceable to a specific rule firing on
specific detections, so it can be explained honestly to a pilot user,
an interviewer, or a judge.

Rule (v1): if 2+ vehicle-class detections stay present across a sustained
run of consecutive sampled frames, treat that as a "sustained proximity"
signal and raise risk proportionally to how long it persists. This is a
crude proxy for "something is loitering near the vehicle" — good enough to
demo and iterate on with real footage, not a claim of behavioral
understanding.

PLANNED: replace frame-presence-counting with actual tracked-object IDs
(once ByteTrack is wired in) so "sustained" means the *same* vehicle, not
just any vehicle being present in each sampled frame.

FUTURE VISION: multi-signal fusion (audio, GPS, motion) — not attempted here.
"""

from dataclasses import dataclass

from detection.interface import FrameDetections

VEHICLE_LABELS = {"car", "truck", "bus", "motorcycle", "bicycle"}
SUSTAINED_PROXIMITY_MIN_VEHICLES = 2
SUSTAINED_PROXIMITY_MIN_CONSECUTIVE_SAMPLES = 5  # at sample_every_n_frames=10 @30fps, ~1.5s+


@dataclass
class RiskEvent:
    event_type: str
    timestamp_seconds: float
    confidence: float
    description: str


@dataclass
class RiskAssessment:
    risk_score: float  # 0.0-1.0
    events: list[RiskEvent]
    summary: str


def score_frames(frame_detections: list[FrameDetections]) -> RiskAssessment:
    events: list[RiskEvent] = []
    consecutive_run = 0
    run_start_ts = None

    for fd in frame_detections:
        vehicle_count = sum(1 for d in fd.detections if d.label in VEHICLE_LABELS)

        if vehicle_count >= SUSTAINED_PROXIMITY_MIN_VEHICLES:
            if consecutive_run == 0:
                run_start_ts = fd.timestamp_seconds
            consecutive_run += 1
        else:
            if consecutive_run >= SUSTAINED_PROXIMITY_MIN_CONSECUTIVE_SAMPLES:
                events.append(_make_sustained_proximity_event(run_start_ts, fd.timestamp_seconds, consecutive_run))
            consecutive_run = 0
            run_start_ts = None

    # flush a run that was still active at the end of the clip
    if consecutive_run >= SUSTAINED_PROXIMITY_MIN_CONSECUTIVE_SAMPLES:
        events.append(_make_sustained_proximity_event(run_start_ts, frame_detections[-1].timestamp_seconds, consecutive_run))

    risk_score = _combine(events)
    summary = _summarize(events, risk_score)
    return RiskAssessment(risk_score=risk_score, events=events, summary=summary)


def _make_sustained_proximity_event(start_ts, end_ts, run_length) -> RiskEvent:
    duration = end_ts - start_ts
    confidence = min(1.0, 0.4 + 0.05 * run_length)  # simple, capped, explainable scaling
    return RiskEvent(
        event_type="sustained_proximity",
        timestamp_seconds=start_ts,
        confidence=confidence,
        description=(
            f"2+ vehicles detected continuously for ~{duration:.1f}s "
            f"starting at {start_ts:.1f}s."
        ),
    )


def _combine(events: list[RiskEvent]) -> float:
    if not events:
        return 0.0
    # simple max-based combination, not a weighted model — deliberately crude v1
    return round(max(e.confidence for e in events), 3)


def _summarize(events: list[RiskEvent], risk_score: float) -> str:
    if not events:
        return "No sustained-proximity signals detected. Risk score 0.0."
    lines = [f"Risk score {risk_score:.2f}, driven by {len(events)} event(s):"]
    lines += [f"- {e.description}" for e in events]
    return "\n".join(lines)
