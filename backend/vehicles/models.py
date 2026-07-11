import uuid

from django.db import models

from organizations.models import Organization


class Vehicle(models.Model):
    """
    CURRENT IMPLEMENTATION:
    A vehicle belonging to one organization. Registration number is the
    real-world identifier; everything else is optional metadata.

    PLANNED:
    - Driver assignment history
    - Camera/hardware profile (once a real capture device is chosen)

    FUTURE VISION:
    - Live telemetry (GPS/speed) ingestion, fleet-wide dashboards
    """

    class VehicleType(models.TextChoices):
        TRUCK = "truck", "Truck"
        CAB = "cab", "Cab"
        BUS = "bus", "Bus"
        PRIVATE_CAR = "private_car", "Private Car"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="vehicles")
    registration_number = models.CharField(max_length=32, unique=True)
    vehicle_type = models.CharField(max_length=32, choices=VehicleType.choices, default=VehicleType.OTHER)
    nickname = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.nickname or self.registration_number
