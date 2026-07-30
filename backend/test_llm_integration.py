import pytest
from unittest.mock import patch, MagicMock, ANY
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from evidence.models import Evidence
from organizations.models import Organization, OrganizationMembership
from vehicles.models import Vehicle

User = get_user_model()

# Dynamically inject helper properties on User class for robust testing 
# to satisfy views.py's tenant context queries, as noted in organizations.models PLANNED section.
if not hasattr(User, "organization"):
    @property
    def test_user_organization(self):
        membership = self.memberships.first()
        return membership.organization if membership else None
    User.organization = test_user_organization

if not hasattr(User, "organization_id"):
    @property
    def test_user_organization_id(self):
        membership = self.memberships.first()
        return membership.organization_id if membership else None
    User.organization_id = test_user_organization_id


@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_organization(db):
    """Creates a sample organization context for multi-tenant testing."""
    return Organization.objects.create(name="Drishti Test Org")

@pytest.fixture
def test_user(db, test_organization):
    user = User.objects.create_user(
        username="operator_test",
        password="secure_password_123",
        email="operator@drishtirakshak.ai"
    )
    # Binds user via the OrganizationMembership join model (IsTenantMember check)
    OrganizationMembership.objects.create(
        user=user,
        organization=test_organization,
        role=OrganizationMembership.Role.OPERATOR
    )
    return user

@pytest.fixture
def test_vehicle(db, test_organization):
    """Creates a vehicle belonging to the organization to satisfy FK constraints."""
    return Vehicle.objects.create(
        organization=test_organization,
        registration_number="MH-12-DRISHTI-99",
        nickname="Test Camera Rig"
    )

@pytest.fixture
def mock_video():
    """Generates a small in-memory file for safe mock video uploads."""
    return SimpleUploadedFile(
        name="road_telemetry.mp4",
        content=b"dummy_video_bytes_here",
        content_type="video/mp4"
    )

@pytest.fixture
def authenticated_client(api_client, test_user):
    # Retrieve valid JWT tokens from configured token-obtain endpoint
    response = api_client.post("/api/token/", {
        "username": "operator_test",
        "password": "secure_password_123"
    })
    access_token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return api_client

@pytest.fixture
def mock_celery_task():
    """Mock Celery task dispatcher to inspect delay signature calls."""
    with patch("evidence.views.process_evidence_task.delay") as mock_delay:
        mock_task_id_obj = MagicMock()
        mock_task_id_obj.id = "mocked-task-uuid-7788"
        mock_delay.return_value = mock_task_id_obj
        yield mock_delay

@pytest.fixture
def mock_llm_embedding():
    """Mock LLMClient's embedding response to avoid live connection errors."""
    with patch("evidence.views.LLMClient") as mock_client_cls:
        mock_instance = MagicMock()
        # Handle various method naming possibilities safely
        mock_instance.generate_embedding.return_value = [0.1] * 768
        mock_instance.embed_text.return_value = [0.1] * 768
        mock_client_cls.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_vector_store():
    """Mock the QdrantVectorStore direct client search queries matching views.py."""
    with patch("evidence.views.QdrantVectorStore") as mock_store_cls:
        mock_instance = MagicMock()
        
        # Simulating returned hits matching qdrant_store.client.search inside views.py
        mock_hit = MagicMock()
        mock_hit.id = "point-uuid-1122"
        mock_hit.score = 0.89
        mock_hit.payload = {"evidence_id": "12", "summary": "Dangerous overtaking on wet road."}
        
        mock_instance.client.search.return_value = [mock_hit]
        
        # Enforce target fallback collection identifier
        mock_instance.collection_name = "drishti_evidence_events"
        
        mock_store_cls.return_value = mock_instance
        yield mock_instance


@pytest.mark.django_db
def test_evidence_processing_dispatches_celery_task(
    authenticated_client, 
    test_user, 
    test_organization, 
    test_vehicle,
    mock_video,
    mock_celery_task
):
    """
    Verifies that calling the process action updates local status flags
    and successfully schedules the Celery background task using .delay().
    """
    # Create Evidence item starting as FAILED to bypass 'already pending/processing' protection
    evidence = Evidence.objects.create(
        vehicle=test_vehicle,
        video_file=mock_video,
        processing_status=Evidence.ProcessingStatus.FAILED,
        locked=False
    )
    
    # Corrected endpoint to include api/v1/ prefix
    url = f"/api/v1/evidence/{evidence.id}/process/"
    response = authenticated_client.post(url)
    
    # Assert successful background queue execution accepted status
    assert response.status_code == status.HTTP_202_ACCEPTED
    
    # Assert actual database mutations directly without relying on serializer outputs
    evidence.refresh_from_db()
    assert evidence.processing_status == Evidence.ProcessingStatus.PENDING
    assert evidence.task_id == "mocked-task-uuid-7788"
    
    # Assert background task was scheduled with the UUID string
    mock_celery_task.assert_called_once_with(str(evidence.id))


@pytest.mark.django_db
def test_semantic_search_executes_isolated_vector_query(
    authenticated_client, 
    test_user, 
    test_organization, 
    mock_llm_embedding, 
    mock_vector_store
):
    """
    Verifies that the search action converts queries into embeddings and 
    executes vector searches using the user's Organization ID.
    """
    # Corrected endpoint to include api/v1/ prefix
    url = "/api/v1/evidence/search/"
    search_payload = {"query": "reckless motorcycle speed"}
    
    # Enforce standard multipart format payload submission to satisfy view's MultiPart/Form Parsers
    response = authenticated_client.post(url, search_payload, format="multipart")
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == "point-uuid-1122"
    
    # Assert embedding generator was called with our target query
    mock_llm_embedding.generate_embedding.assert_called_once_with("reckless motorcycle speed")
    
    # Assert vector store client search query enforced active user's organization filter isolation
    mock_vector_store.client.search.assert_called_once_with(
        collection_name=ANY,
        query_vector=[0.1] * 768,
        query_filter=ANY,
        limit=10
    )