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


from django.conf import settings  # noqa: E402 (Local import keeping the relationship self-contained)

class OrganizationMembership(models.Model):
    """
    CURRENT IMPLEMENTATION:
    Maps a Django Auth User to an Organization with a designated role choice 
    (owner, operator, viewer). This is the foundation of our multi-tenant 
    authorization boundaries [12].

    PLANNED:
    - Helper properties on the User model to fetch active organization context
    - Soft-deletion of memberships instead of hard-deletion to preserve audit trails

    FUTURE VISION:
    - Cross-organization invitation flow with temporary, expirable tokens
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        OPERATOR = "operator", "Operator"
        VIEWER = "viewer", "Viewer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
        help_text="The Django system user holding this membership."
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
        help_text="The tenant organization [12]."
    )
    role = models.CharField(
        max_length=16,
        choices=Role.choices,
        default=Role.VIEWER,
        help_text="The authorized role defining operation boundaries [12]."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "organization"],
                name="unique_user_organization_membership"
            )
        ]
        ordering = ["organization", "user"]

    def __str__(self) -> str:
        return f"{self.user.username} ({self.get_role_display()}) — {self.organization.name}"