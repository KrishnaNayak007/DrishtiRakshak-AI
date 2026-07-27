from rest_framework import viewsets

from common.permissions import IsTenantMember, TenantScopedQuerySetMixin
from .models import Organization, OrganizationMembership
from .serializers import OrganizationSerializer, OrganizationMembershipSerializer


class OrganizationViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Manages tenant organizations. Scoped to authorized members [12, 13].
    """
    queryset = Organization.objects.all().order_by("-created_at")
    serializer_class = OrganizationSerializer
    permission_classes = [IsTenantMember]


class OrganizationMembershipViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Manages user role profiles across active tenants [12, 13].
    """
    queryset = OrganizationMembership.objects.all()
    serializer_class = OrganizationMembershipSerializer
    permission_classes = [IsTenantMember]