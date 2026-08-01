from rest_framework import serializers
from .models import PoliceDispatch


class PoliceDispatchSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()

    class Meta:
        model = PoliceDispatch
        fields = [
            'id',
            'dispatch_number',
            'vehicle_plate',
            'driver_name',
            'timestamp',
            'location',
            'latitude',
            'longitude',
            'address',
            'threat_type',
            'threat_category_label',
            'risk_score',
            'status',
            'resolved_at',
            'resolved_by',
            'sha256_hash',
            'ai_summary',
            'created_at',
        ]

    def get_location(self, obj: PoliceDispatch) -> dict:
        return {
            'lat': obj.latitude,
            'lng': obj.longitude,
            'address': obj.address,
        }
