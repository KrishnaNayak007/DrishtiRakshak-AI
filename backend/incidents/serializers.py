from rest_framework import serializers

from incidents.models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = ["id", "evidence", "risk_score", "status", "summary", "created_at"]
        read_only_fields = fields  # incidents are only produced by the detection pipeline, never edited directly