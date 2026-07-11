import hashlib
import uuid

from django.db import models

from vehicles.models import Vehicle


def evidence_upload_path(instance, filename):
    return f"evidence/{instance.vehicle_id}/{instance.id}/{filename}"


class Evidence(models.Model):
    """
    CURRENT IMPLEMENTATION:
    One uploaded video clip. On lock(), we hash the file and freeze it —
    this demonstrates the *pattern* of tamper-evidence (a hash that would
    change if the file were altered), not a legally admissible chain of
    custody. That distinction must stay explicit anywhere this is described
    externally (README, demo, pitch).

    PLANNED:
    - Multi-file evidence packages (video + extracted frames + JSON report)
    - Retention policy field

    FUTURE VISION:
    - Encrypted-at-rest object storage, legal-grade custody workflow
      (requires actual legal review before ever being claimed as such)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="evidence_items")
    video_file = models.FileField(upload_to=evidence_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    sha256_hash = models.CharField(max_length=64, blank=True)
    locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    processed = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Evidence {self.id} ({self.vehicle})"

    def compute_hash(self) -> str:
        """Compute sha256 over the stored file. Does not lock it."""
        hasher = hashlib.sha256()
        self.video_file.open("rb")
        try:
            for chunk in self.video_file.chunks():
                hasher.update(chunk)
        finally:
            self.video_file.close()
        return hasher.hexdigest()

    def lock(self) -> None:
        """
        Freeze this evidence item: compute and store its hash, mark locked.
        Once locked, application logic should refuse further edits to the
        underlying file (enforced at the view/service layer, not here).
        """
        from django.utils import timezone

        self.sha256_hash = self.compute_hash()
        self.locked = True
        self.locked_at = timezone.now()
        self.save(update_fields=["sha256_hash", "locked", "locked_at"])


class TimelineEvent(models.Model):
    """
    CURRENT IMPLEMENTATION:
    One detected event at a specific offset within an Evidence clip —
    produced by the detection module's heuristic scoring, not a learned
    "threat model". event_type + confidence + description together form
    the explainability trail: every score should be traceable to specific
    detections, not an opaque number.
    """

    class EventType(models.TextChoices):
        VEHICLE_DETECTED = "vehicle_detected", "Vehicle Detected"
        PERSON_DETECTED = "person_detected", "Person Detected"
        SUSTAINED_PROXIMITY = "sustained_proximity", "Sustained Proximity"
        SUDDEN_DECELERATION = "sudden_deceleration", "Sudden Deceleration"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name="timeline_events")
    timestamp_offset_seconds = models.FloatField()
    event_type = models.CharField(max_length=32, choices=EventType.choices)
    confidence = models.FloatField(help_text="0.0-1.0, from the detection/heuristic layer.")
    description = models.CharField(max_length=500, blank=True)
    bounding_boxes = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["timestamp_offset_seconds"]

    def __str__(self) -> str:
        return f"{self.event_type} @ {self.timestamp_offset_seconds}s"
