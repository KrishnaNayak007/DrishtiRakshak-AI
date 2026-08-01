import random
import uuid
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import PoliceDispatch
from .serializers import PoliceDispatchSerializer


class PoliceDispatchViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing emergency police dispatches, resolving cases,
    and simulating live driver SOS emergency dispatches.
    """
    queryset = PoliceDispatch.objects.all()
    serializer_class = PoliceDispatchSerializer
    permission_classes = [AllowAny]  # Allow viewing/demoing without auth block

    @action(detail=True, methods=['post'])
    def solve(self, request, pk=None):
        """
        Mark a police dispatch case as SOLVED.
        """
        dispatch = self.get_object()
        notes = request.data.get('notes', '')
        
        dispatch.status = PoliceDispatch.Status.CASE_SOLVED
        dispatch.resolved_at = timezone.now()
        dispatch.resolved_by = request.data.get('resolved_by', 'Inspector S. Patnaik (Traffic Cyber Cell)')
        if notes:
            dispatch.ai_summary += f"\n\n[RESOLVED NOTES]: {notes}"
        dispatch.save()

        serializer = self.get_serializer(dispatch)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def simulate_sos(self, request):
        """
        Simulate an incoming live emergency driver SOS dispatch.
        """
        vehicle_plate = request.data.get('vehicle_plate', 'MH-12-GQ-9831')
        driver_name = request.data.get('driver_name', 'Active Operator')
        
        dispatch_num = f"PCR-2026-{random.randint(1000, 9999)}"
        sha_hash = uuid.uuid4().hex + uuid.uuid4().hex[:8]

        dispatch = PoliceDispatch.objects.create(
            dispatch_number=dispatch_num,
            vehicle_plate=vehicle_plate,
            driver_name=driver_name,
            latitude=20.2960 + (random.random() - 0.5) * 0.01,
            longitude=85.8245 + (random.random() - 0.5) * 0.01,
            address="NH-16 Expressway, Near Smart City Toll Gate",
            threat_type=PoliceDispatch.ThreatType.STAGED_COLLISION_FRAUD,
            threat_category_label="Intentional Pedestrian Obstruction (Staged Collision / Insurance Fraud)",
            risk_score=98.0,
            status=PoliceDispatch.Status.CRITICAL_SOS,
            sha256_hash=sha_hash,
            ai_summary="Continuous dashcam stream clipped 12s video segment during sudden deceleration at 54 km/h. Intentional pedestrian obstacle detected in vehicle path. Auto-pushed to Police Portal.",
        )

        serializer = self.get_serializer(dispatch)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
