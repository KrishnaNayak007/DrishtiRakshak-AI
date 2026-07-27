from rest_framework import viewsets

from common.permissions import IsTenantMember, TenantScopedQuerySetMixin
from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Manages physical vehicles linked to your tenant organizations [12, 13].
    """
    queryset = Vehicle.objects.all().order_by("-created_at")
    serializer_class = VehicleSerializer
    permission_classes = [IsTenantMember]