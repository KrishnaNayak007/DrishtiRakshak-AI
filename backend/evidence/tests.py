import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from organizations.models import Organization, OrganizationMembership
from vehicles.models import Vehicle
from .models import Evidence

User = get_user_model()


@pytest.fixture
def mock_video():
    """Generates a small in-memory file for safe mock video uploads [11, 12]."""
    return SimpleUploadedFile(
        name="road_telemetry.mp4",
        content=b"dummy_video_bytes_here",
        content_type="video/mp4"
    )


@pytest.mark.django_db
class TestMultiTenantIsolation:

    @pytest.fixture(autouse=True)
    def setup_multitenant_nodes(self, mock_video):
        """
        Creates two distinct organizations (Org A and Org B), binds users 
        with corresponding role memberships, and generates isolated assets [12].
        """
        # 1. Establish tenant organizations
        self.org_a = Organization.objects.create(name="Fleet A Logistics")
        self.org_b = Organization.objects.create(name="Fleet B Cabs")

        # 2. Create Django users
        self.user_a = User.objects.create_user(username="operator_a", password="password123")
        self.user_b = User.objects.create_user(username="operator_b", password="password123")
        self.superuser = User.objects.create_superuser(username="admin_sys", password="password123")

        # 3. Create tenant-scoped memberships [12]
        OrganizationMembership.objects.create(
            user=self.user_a, organization=self.org_a, role=OrganizationMembership.Role.OPERATOR
        )
        OrganizationMembership.objects.create(
            user=self.user_b, organization=self.org_b, role=OrganizationMembership.Role.OPERATOR
        )

        # 4. Generate scoped vehicles [12]
        self.vehicle_a = Vehicle.objects.create(
            organization=self.org_a, registration_number="WB-02-1111", nickname="Truck A1"
        )
        self.vehicle_b = Vehicle.objects.create(
            organization=self.org_b, registration_number="KA-03-2222", nickname="Cab B1"
        )

        # 5. Populate isolated evidence records [12]
        self.evidence_a = Evidence.objects.create(
            vehicle=self.vehicle_a,
            video_file=mock_video
        )
        self.evidence_b = Evidence.objects.create(
            vehicle=self.vehicle_b,
            video_file=mock_video
        )
        # 6. Configure authenticated API clients
        self.client_a = APIClient()
        response_a = self.client_a.post("/api/token/", {"username": "operator_a", "password": "password123"})
        self.client_a.credentials(HTTP_AUTHORIZATION=f"Bearer {response_a.data['access']}")

        self.client_b = APIClient()
        response_b = self.client_b.post("/api/token/", {"username": "operator_b", "password": "password123"})
        self.client_b.credentials(HTTP_AUTHORIZATION=f"Bearer {response_b.data['access']}")

        self.client_admin = APIClient()
        response_admin = self.client_admin.post("/api/token/", {"username": "admin_sys", "password": "password123"})
        self.client_admin.credentials(HTTP_AUTHORIZATION=f"Bearer {response_admin.data['access']}")

    def test_listing_is_strictly_scoped_by_tenant_membership(self):
        """
        Verify that listing evidence returns ONLY items belonging to 
        the active user's associated organization [12, 13].
        """
        # Client A should see ONLY Evidence A
        res_a = self.client_a.get("/api/v1/evidence/")
        assert res_a.status_code == 200
        assert res_a.data["count"] == 1
        assert res_a.data["results"][0]["id"] == str(self.evidence_a.id)

        # Client B should see ONLY Evidence B
        res_b = self.client_b.get("/api/v1/evidence/")
        assert res_b.status_code == 200
        assert res_b.data["count"] == 1
        assert res_b.data["results"][0]["id"] == str(self.evidence_b.id)

    def test_cross_tenant_detail_retrieval_returns_404(self):
        """
        Verify that directly retrieving another organization's asset 
        safely raises a 404 Not Found rather than leaking metadata [12, 13].
        """
        # Client A attempts to retrieve Evidence B (Must fail)
        url = f"/api/v1/evidence/{self.evidence_b.id}/"
        res = self.client_a.get(url)
        assert res.status_code == 404

    def test_cross_tenant_action_execution_is_blocked_with_404(self):
        """
        Verify that custom viewset triggers (like /process/) are blocked 
        with 404 on cross-tenant operations [13].
        """
        # Client A tries to run processing on Evidence B
        url = f"/api/v1/evidence/{self.evidence_b.id}/process/"
        res = self.client_a.post(url)
        assert res.status_code == 404

    def test_superuser_bypasses_all_tenant_boundaries(self):
        """
        Verify that a system superuser is granted global query privileges [12].
        """
        res = self.client_admin.get("/api/v1/evidence/")
        assert res.status_code == 200
        # Admin must see both Org A and Org B records
        assert res.data["count"] == 2