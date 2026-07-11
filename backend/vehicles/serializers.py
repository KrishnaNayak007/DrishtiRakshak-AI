from rest_framework import serializers

from vehicles.models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["id", "organization", "registration_number", "vehicle_type", "nickname", "created_at"]
        read_only_fields = ["id", "created_at"]