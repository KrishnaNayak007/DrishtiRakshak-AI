from rest_framework import viewsets

from organizations.models import Organization
from organizations.serializers import OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    """Plain CRUD. No multi-tenant scoping/permissions yet — single-org use only (see README)."""

    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
