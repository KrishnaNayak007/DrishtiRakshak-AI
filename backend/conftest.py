# backend/tests/test_llm_integration.py
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from evidence.models import Evidence
from organizations.models import Organization  # Adjust to point to your Organization model class

User = get_user_model()

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
    # Link user to organization context
    user.organization = test_organization
    if hasattr(user, "organization_id"):
        user.organization_id = test_organization.id
    user.save()
    return user

@pytest.fixture
def authenticated_client(api_client, test_user):
    # Retrieve valid JWT tokens from your configured token-obtain endpoint
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
        mock_instance.generate_embedding.return_value = [0.1] * 768
        mock_client_cls.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_vector_store():
    """Mock the VectorStore class search queries."""
    with patch("evidence.views.VectorStore") as mock_store_cls:
        mock_instance = MagicMock()
        
        # Simulating returned hits from Qdrant
        mock_hit = MagicMock()
        mock_hit.id = "point-uuid-1122"
        mock_hit.score = 0.89
        mock_hit.payload = {"evidence_id": "12", "summary": "Dangerous overtaking on wet road."}
        
        mock_instance.search_evidence.return_value = [mock_hit]
        mock_store_cls.return_value = mock_instance
        yield mock_instance


@pytest.mark.django_db
def test_evidence_processing_dispatches_celery_task(
    authenticated_client, 
    test_user, 
    test_organization, 
    mock_celery_task
):
    """
    Verifies that calling the process action updates local status to PENDING
    and successfully schedules the Celery background task using .delay().
    """
    # Create unprocessed Evidence item for testing
    evidence = Evidence.objects.create(
        organization=test_organization,
        title="Test Clip",
        processing_status=Evidence.ProcessingStatus.UNPROCESSED,
        locked=False
    )
    
    url = f"/api/evidence/{evidence.id}/process/"
    response = authenticated_client.post(url)
    
    assert response.status_code == status.HTTP_202_ACCEPTED
    assert response.data["processing_status"] == Evidence.ProcessingStatus.PENDING
    assert response.data["task_id"] == "mocked-task-uuid-7788"
    
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
    url = "/api/evidence/search/"
    search_payload = {"query": "reckless motorcycle speed"}
    
    response = authenticated_client.post(url, search_payload, format="json")
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == "point-uuid-1122"
    
    # Assert embedding was requested
    mock_llm_embedding.assert_called_once()
    
    # Assert vector store query enforced active user's organization filter isolation
    mock_vector_store.search_evidence.assert_called_once_with(
        query_vector=[0.1] * 768,
        organization_id=str(test_organization.id),
        limit=10
    )