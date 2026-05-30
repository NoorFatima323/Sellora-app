import requests

def test_post_api_auth_login_with_invalid_credentials():
    base_url = "http://localhost:8000"
    endpoint = "/api/auth/login"
    url = base_url + endpoint
    payload = {
        "email": "testqa@sellora.com",
        "password": "wrongpassword"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"

test_post_api_auth_login_with_invalid_credentials()