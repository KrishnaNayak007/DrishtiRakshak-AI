import os
from django.conf import settings
from rest_framework import serializers

from evidence.models import Evidence, TimelineEvent
from incidents.serializers import IncidentSerializer

ALLOWED_VIDEO_EXTENSIONS = ('.mp4', '.avi', '.mov', '.mkv', '.mpeg', '.mpg')


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

    def validate_video_file(self, value):
        # 1. Size check using Django settings
        if value.size > settings.MAX_UPLOAD_SIZE:
            limit_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
            raise serializers.ValidationError(f"File size exceeds the {limit_mb:.0f}MB limit.")
        
        # 2. Extension check using module-level constant
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_VIDEO_EXTENSIONS:
            allowed_str = ", ".join([e.strip('.') for e in ALLOWED_VIDEO_EXTENSIONS])
            raise serializers.ValidationError(
                f"Unsupported file extension. Allowed extensions are: {allowed_str}."
            )
        
        # 3. Content type check
        if hasattr(value, 'content_type'):
            if not value.content_type.startswith('video/'):
                raise serializers.ValidationError("File is not a valid video.")
        return value