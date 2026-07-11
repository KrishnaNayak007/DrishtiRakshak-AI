from rest_framework import viewsets

from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
