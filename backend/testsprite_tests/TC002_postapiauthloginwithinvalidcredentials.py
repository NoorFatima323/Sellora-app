import requests

def test_post_api_auth_login_with_invalid_credentials():
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    # Using intentionally invalid credentials
    payload = {
        "username": "invaliduser@example.com",
        "password": "wrongpassword123"
    }
    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to {endpoint} failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Response content could vary, ensure it does not contain token or success indication
    try:
        json_response = response.json()
    except ValueError:
        json_response = {}

    # Assert no token in response
    assert "token" not in json_response and "access_token" not in json_response, "Response should not contain authentication token"
    
test_post_api_auth_login_with_invalid_credentials()
