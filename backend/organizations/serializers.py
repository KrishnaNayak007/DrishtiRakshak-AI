from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Organization, OrganizationMembership

User = get_user_model()


class UserMinSerializer(serializers.ModelSerializer):
    """Minimal representation of a Django user for nested display [12]."""
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "org_type", "contact_email", "is_pilot", "created_at"]
        read_only_fields = ["id", "created_at"]


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    user_detail = UserMinSerializer(source="user", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = ["id", "user", "user_detail", "organization", "role", "created_at"]
        read_only_fields = ["id", "created_at"]