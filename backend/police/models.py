import uuid
from django.db import models
from django.utils import timezone


class PoliceDispatch(models.Model):
    """
    Police Emergency Dispatch Model.
    Stores continuous dashcam emergency dispatches auto-clipped by AI during 
    roadside threats (staged insurance fraud collisions & roadside robbery attempts).
    """

    class ThreatType(models.TextChoices):
        STAGED_COLLISION_FRAUD = "STAGED_COLLISION_FRAUD", "Intentional Pedestrian Obstruction (Staged Collision / Insurance Fraud)"
        ROADBLOCK_ROBBERY_THREAT = "ROADBLOCK_ROBBERY_THREAT", "Roadblock Obstruction / Robbery Attempt"
        SUDDEN_DECELERATION_SPIKE = "SUDDEN_DECELERATION_SPIKE", "Sudden Emergency Deceleration Spike"

    class Status(models.TextChoices):
        CRITICAL_SOS = "CRITICAL_SOS", "Critical SOS Dispatch"
        DISPATCHED = "DISPATCHED", "Patrol Unit En-Route"
        CASE_SOLVED = "CASE_SOLVED", "Case Solved & Verified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispatch_number = models.CharField(max_length=64, unique=True, help_text="Police Control Room Reference ID")
    vehicle_plate = models.CharField(max_length=64, help_text="Vehicle License Plate Registration Number")
    driver_name = models.CharField(max_length=128, default="Driver", help_text="Driver / Operator Name")
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Location coordinates & address
    latitude = models.FloatField(default=20.2960)
    longitude = models.FloatField(default=85.8245)
    address = models.CharField(max_length=256, default="NH-16 Expressway, Km 42 (Bhubaneswar-Cuttack Corridor)")
    
    # AI Threat Assessment
    threat_type = models.CharField(max_length=64, choices=ThreatType.choices, default=ThreatType.STAGED_COLLISION_FRAUD)
    threat_category_label = models.CharField(max_length=256, blank=True, default="")
    risk_score = models.FloatField(default=95.0, help_text="0-100 Threat Index Score")
    
    # Case Resolution & Audit
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.CRITICAL_SOS)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.CharField(max_length=128, blank=True, default="")
    
    # Cryptographic Proof & AI Clip Summary
    sha256_hash = models.CharField(max_length=128, blank=True, default="")
    ai_summary = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self) -> str:
        return f"[{self.dispatch_number}] {self.vehicle_plate} - {self.status}"
