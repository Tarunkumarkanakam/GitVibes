import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "GitVibe API is up and running!"}

# Note: More comprehensive tests would be added in a real project
# These would include mocking the GitHub API responses
