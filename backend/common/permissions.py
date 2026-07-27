from rest_framework import permissions
from organizations.models import OrganizationMembership
from organizations.models import Organization
from vehicles.models import Vehicle
from evidence.models import Evidence
from incidents.models import Incident

class IsTenantMember(permissions.BasePermission):
    """
    CURRENT IMPLEMENTATION:
    Enforces that a user can only read, write, or process assets (vehicles, 
    evidence, incidents) belonging to an Organization where they hold an active 
    OrganizationMembership [12].
    
    If the user is a superuser, they bypass this check to allow system-wide 
    administration workflows.
    """

    def has_permission(self, request, view):
        # Global authenticated fallback check [13]
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        

        target_org = None

        # Trace relationship tree back to the parent Organization [12]
        if isinstance(obj, Organization):
            target_org = obj
        elif isinstance(obj, Vehicle):
            target_org = obj.organization
        elif isinstance(obj, Evidence):
            target_org = obj.vehicle.organization
        elif isinstance(obj, Incident):
            target_org = obj.vehicle.organization

        if not target_org:
            return False

        # Permit operation only if user holds an active membership with the target organization [12]
        return OrganizationMembership.objects.filter(
            user=request.user,
            organization=target_org
        ).exists()


class TenantScopedQuerySetMixin:
    """
    CURRENT IMPLEMENTATION:
    Mixes into ModelViewSets to automatically filter database querysets 
    down to the logged-in user's active membership organizations [12, 13].
    """

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_superuser:
            return queryset

        # Retrieve list of organizations where the user has active memberships [12]
        user_org_ids = OrganizationMembership.objects.filter(
            user=user
        ).values_list("organization_id", flat=True)

        model_class = queryset.model

        

        # Enforce scoping boundaries [12]
        if issubclass(model_class, Organization):
            return queryset.filter(id__in=user_org_ids)
        elif issubclass(model_class, OrganizationMembership):
            return queryset.filter(organization_id__in=user_org_ids)
        elif issubclass(model_class, Vehicle):
            return queryset.filter(organization_id__in=user_org_ids)
        elif issubclass(model_class, Evidence):
            return queryset.filter(vehicle__organization_id__in=user_org_ids)
        elif issubclass(model_class, Incident):
            return queryset.filter(vehicle__organization_id__in=user_org_ids)

        return queryset.none()