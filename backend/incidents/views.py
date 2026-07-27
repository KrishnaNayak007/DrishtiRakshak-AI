from rest_framework import viewsets

from common.permissions import IsTenantMember, TenantScopedQuerySetMixin
from .models import Incident
from .serializers import IncidentSerializer


class IncidentViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Manages evaluated road anomalies and incidents within tenant bounds [12, 13].
    """
    queryset = Incident.objects.all().order_by("-created_at")
    serializer_class = IncidentSerializer
    permission_classes = [IsTenantMember]