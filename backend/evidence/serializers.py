from rest_framework import serializers

from evidence.models import Evidence, TimelineEvent
from incidents.serializers import IncidentSerializer


class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = ["id", "timestamp_offset_seconds", "event_type", "confidence", "description", "bounding_boxes"]


class EvidenceSerializer(serializers.ModelSerializer):
    """
    Nests timeline_events and incident as read-only — a client fetching one
    Evidence record gets the full picture (clip + detected events + risk
    score) in one request, which is exactly what a timeline UI needs.
    """

    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    incident = IncidentSerializer(read_only=True)

    class Meta:
        model = Evidence
        fields = [
            "id", "vehicle", "video_file", "uploaded_at",
            "sha256_hash", "locked", "locked_at", "processed",
            "timeline_events", "incident",
        ]
        read_only_fields = ["id", "uploaded_at", "sha256_hash", "locked", "locked_at", "processed"]