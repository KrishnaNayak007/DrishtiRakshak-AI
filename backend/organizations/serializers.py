from rest_framework import serializers

from organizations.models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "org_type", "contact_email", "is_pilot", "created_at"]
        read_only_fields = ["id", "created_at"]