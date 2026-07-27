import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        username="operator_test",
        password="secure_password_123",
        email="operator@drishtirakshak.ai"
    )

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