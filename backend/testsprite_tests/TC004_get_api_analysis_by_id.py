import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def get_auth_token():
    login_payload = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


def test_get_api_analysis_by_id():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    analysis_payload = {
        "title": "Sample Analysis",
        "description": "This is a test analysis.",
        "data": {"key": "value"}
    }
    analysis_id = None
    try:
        # Create a new analysis first
        create_response = requests.post(
            f"{BASE_URL}/api/analysis",
            json=analysis_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 200, f"Failed to create analysis: {create_response.text}"
        created_analysis = create_response.json()
        analysis_id = created_analysis.get("id")
        assert analysis_id is not None, "Created analysis does not contain 'id'"

        # Retrieve the analysis by ID
        get_response = requests.get(
            f"{BASE_URL}/api/analysis/{analysis_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Failed to retrieve analysis with id {analysis_id}: {get_response.text}"
        data = get_response.json()
        assert data.get("id") == analysis_id, "Analysis ID mismatch"
        assert data.get("title") == analysis_payload["title"], "Analysis title mismatch"
        assert data.get("description") == analysis_payload["description"], "Analysis description mismatch"
        assert data.get("data") == analysis_payload["data"], "Analysis data mismatch"

    finally:
        # Clean up by deleting the created analysis if possible
        if analysis_id:
            requests.delete(
                f"{BASE_URL}/api/analysis/{analysis_id}",
                headers=headers,
                timeout=TIMEOUT
            )


test_get_api_analysis_by_id()
