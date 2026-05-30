import requests

def test_post_api_auth_login_with_valid_credentials():
    base_url = "http://localhost:8000"
    endpoint = "/api/auth/login"
    url = base_url + endpoint

    payload = {
        "username": "testuser@example.com",
        "password": "TestPassword123!"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    json_response = response.json()
    # PRD specifies to receive 200 with JWT token, so check token presence
    assert "token" in json_response or "access_token" in json_response, "JWT token not found in response"
    token = json_response.get("token") or json_response.get("access_token")
    assert isinstance(token, str) and len(token) > 0, "JWT token is empty or not a string"

test_post_api_auth_login_with_valid_credentials()
