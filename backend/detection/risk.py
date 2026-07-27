from collections import Counter
from typing import List

from detection.interface import Assessment, FrameDetections, ScoringEvent


def score_frames(frames: List[FrameDetections]) -> Assessment:
    """
    Evaluates a sequence of FrameDetections and computes a transparent risk score.
    No black-box models are used here; the math relies on clear weighted heuristics [6].
    """
    events: List[ScoringEvent] = []
    
    if not frames:
        return Assessment(
            risk_score=0.0,
            summary="No video data or frames available for analysis.",
            events=[]
        )

    # 1. Track object frequencies to determine "Sustained Proximity"
    total_sampled_frames = len(frames)
    label_frame_counts = Counter()
    
    # Track when objects first appeared
    first_seen = {}

    for frame in frames:
        # Deduplicate labels in the same frame to count frame presence frequency
        unique_labels_in_frame = {det.label for det in frame.detections}
        for label in unique_labels_in_frame:
            label_frame_counts[label] += 1
            if label not in first_seen:
                first_seen[label] = frame.timestamp

    # 2. Heuristic: Person Detected
    # People detected on roadways present an immediate, high-priority safety risk [8].
    for frame in frames:
        person_detections = [d for d in frame.detections if d.label == "person"]
        if person_detections:
            max_conf = max(p.confidence for p in person_detections)
            events.append(
                ScoringEvent(
                    timestamp_seconds=frame.timestamp,
                    event_type="person_detected",
                    confidence=max_conf,
                    description=f"Vulnerable road user (person) detected at offset {frame.timestamp:.2f}s."
                )
            )
            # Flag only once in this simple model to avoid event spamming
            break

    # 3. Heuristic: Sustained Proximity
    # If a motorcycle or other vehicle appears in >= 50% of your sampled frames,
    # and has been present for over 3 seconds, trigger sustained proximity [3, 8].
    for label, count in label_frame_counts.items():
        if label in ["motorcycle", "car", "truck"] and total_sampled_frames >= 4:
            ratio = count / total_sampled_frames
            if ratio >= 0.5:
                # Calculate duration of presence
                durations = [f.timestamp for f in frames if any(d.label == label for d in f.detections)]
                if durations and (max(durations) - min(durations)) >= 3.0:
                    events.append(
                        ScoringEvent(
                            timestamp_seconds=min(durations),
                            event_type="sustained_proximity",
                            confidence=ratio,
                            description=f"Sustained proximity of a {label} detected (present in {ratio*100:.0f}% of frames)."
                        )
                    )

    # 4. Heuristic: Vehicle Detected
    # Ensure standard vehicle presences are logged as baseline events
    for frame in frames:
        vehicles = [d for d in frame.detections if d.label in ["car", "truck", "bus"]]
        if vehicles:
            max_conf = max(v.confidence for v in vehicles)
            events.append(
                ScoringEvent(
                    timestamp_seconds=frame.timestamp,
                    event_type="vehicle_detected",
                    confidence=max_conf,
                    description=f"Standard roadway vehicle detected at offset {frame.timestamp:.2f}s."
                )
            )
            break

    # 5. Transparent Weighted Scoring Math
    # Simple weights applied to detected events to derive final risk score [6]
    score = 0.0
    triggered_types = {e.event_type for e in events}

    if "vehicle_detected" in triggered_types:
        score += 0.15
    if "person_detected" in triggered_types:
        score += 0.30
    if "sustained_proximity" in triggered_types:
        score += 0.45
    if "sudden_deceleration" in triggered_types:
        score += 0.50

    # Cap score cleanly at 1.0 (100% risk) [20]
    final_score = min(score, 1.0)

    # 6. Generate Explainable Narrative
    # The summary details exactly which logical checks triggered the risk score [10, 20].
    if not events:
        summary = "No unusual telemetry conditions or threat patterns identified. Driving environment is normal."
    else:
        event_summary_strs = [f"- {e.description}" for e in events]
        summary = (
            f"Threat evaluation concluded with a risk score of {final_score:.2f}.\n"
            f"The following indicators contributed to this risk evaluation:\n"
            + "\n".join(event_summary_strs)
        )

    return Assessment(
        risk_score=final_score,
        summary=summary,
        events=events
    )