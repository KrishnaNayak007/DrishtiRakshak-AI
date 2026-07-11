import uuid

from django.db import models


class Organization(models.Model):
    """
    CURRENT IMPLEMENTATION:
    A single tenant using the platform — e.g. one fleet operator, one pilot
    partner. No multi-tenant routing/isolation logic exists yet beyond this
    foreign key boundary; that's intentional until a second real org exists.

    PLANNED (when a second pilot org signs on):
    - Per-org configuration (notification policy, retention policy)
    - Membership/roles (owner, operator, viewer)

    FUTURE VISION (not implemented, not scheduled):
    - Org-level analytics, billing, multi-region deployment
    """

    class OrgType(models.TextChoices):
        LOGISTICS_FLEET = "logistics_fleet", "Logistics Fleet"
        CAB_OPERATOR = "cab_operator", "Cab / Ride Operator"
        SCHOOL_TRANSPORT = "school_transport", "School Transport"
        INDIVIDUAL = "individual", "Individual Vehicle Owner"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    org_type = models.CharField(max_length=32, choices=OrgType.choices, default=OrgType.OTHER)
    contact_email = models.EmailField(blank=True)
    is_pilot = models.BooleanField(
        default=False,
        help_text="Marks this org as an active real-world pilot (vs. internal test data).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name
