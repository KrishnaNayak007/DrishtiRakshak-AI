import uuid

from django.db import models

from evidence.models import Evidence


class Incident(models.Model):
    """
    CURRENT IMPLEMENTATION:
    Groups one Evidence clip with an overall risk score computed by the
    rule-based heuristic in detection/risk.py. This is NOT a "Threat
    Assessment Agent" — it's a transparent weighted sum over TimelineEvents,
    and the summary field must always be able to say exactly which events
    contributed to the score.

    PLANNED:
    - Manual review/status workflow (open -> reviewed -> closed)
    - Linking multiple Evidence clips to one Incident (multi-camera)

    FUTURE VISION:
    - Cross-vehicle incident correlation, notification workflows
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evidence = models.OneToOneField(Evidence, on_delete=models.CASCADE, related_name="incident")
    risk_score = models.FloatField(default=0.0, help_text="0.0-1.0, transparent weighted heuristic.")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    summary = models.TextField(
        blank=True,
        help_text="Human-readable explanation of which timeline events drove the risk score.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Incident {self.id} (risk={self.risk_score:.2f})"
