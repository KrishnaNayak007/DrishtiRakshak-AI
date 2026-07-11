"""
CURRENT IMPLEMENTATION: pretrained YOLOv8 wrapper, sampling every Nth frame
(full-frame-rate inference is unnecessary and slow for this use case).
Model is loaded lazily and cached at module level so it's only loaded once
per process.

If ultralytics isn't installed (e.g. quick local testing without the heavy
CV deps), falls back to a stub detector that returns no detections, so the
rest of the pipeline is still exercisable end-to-end. With ultralytics
installed, this runs real inference — no separate code path, no flag to
flip.

PLANNED: object tracking (ByteTrack) so the same vehicle keeps one ID across
frames instead of being re-detected from scratch each sample — this is what
"sustained proximity" scoring in risk.py actually needs to be accurate.

FUTURE VISION: on-device/edge inference, multi-camera sync. Not attempted here.
"""

import logging

import cv2

from detection.interface import Detection, FrameDetections

logger = logging.getLogger(__name__)

_model = None

# Coarse label set relevant to road scenes; ultralytics' default COCO labels
# include far more classes than we need.
RELEVANT_LABELS = {"car", "truck", "bus", "motorcycle", "bicycle", "person"}

# Ignore weak detections before they reach the risk engine.
MIN_CONFIDENCE = 0.4


def _get_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO

        _model = YOLO("yolov8n.pt")  # smallest pretrained checkpoint
        logger.info("Loaded YOLOv8n model for detection.")
    except ImportError:
        _model = False
        logger.warning(
            "ultralytics not installed — detection running in stub mode (no detections)."
        )
    return _model


class VideoReadError(Exception):
    """Raised when a video file can't be opened or contains no readable frames."""


def detect_video(video_path: str, sample_every_n_frames: int = 10) -> list[FrameDetections]:
    """
    Reads a video file, runs detection on every Nth frame, returns a
    chronological list of FrameDetections. Sampling rate trades accuracy for
    speed — 10 is a reasonable default for a prototype, not a tuned value.

    Raises VideoReadError if the file can't be opened or has no readable frames.
    """
    model = _get_model()
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise VideoReadError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    results: list[FrameDetections] = []
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_index % sample_every_n_frames == 0:
            timestamp = frame_index / fps
            detections = _detect_frame(model, frame)
            results.append(FrameDetections(frame_index, timestamp, detections))

        frame_index += 1

    cap.release()

    if frame_index == 0:
        raise VideoReadError(
            f"Video file opened but contained no readable frames: {video_path}"
        )

    total_detections = sum(len(fd.detections) for fd in results)
    logger.info(
        "Processed %s (%d sampled frames, %d total detections above confidence %.2f).",
        video_path,
        len(results),
        total_detections,
        MIN_CONFIDENCE,
    )

    return results


def _detect_frame(model, frame) -> list[Detection]:
    if model is False:
        return []

    output = model(frame, verbose=False)[0]
    detections = []

    for box in output.boxes:
        conf = float(box.conf[0])
        if conf < MIN_CONFIDENCE:
            continue

        label = model.names[int(box.cls[0])]
        if label not in RELEVANT_LABELS:
            continue

        xyxy = tuple(float(v) for v in box.xyxy[0])
        detections.append(
            Detection(
                label=label,
                confidence=conf,
                box_xyxy=xyxy,
            )
        )

    return detections