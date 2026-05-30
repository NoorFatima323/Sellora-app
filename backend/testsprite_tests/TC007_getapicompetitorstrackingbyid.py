import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def get_auth_token():
    login_data = {
        "email": "testuser",
        "password": "testpassword"
    }
    headers = {"Content-Type": "application/json"}
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status code {resp.status_code}"
    resp_json = resp.json()
    token = resp_json.get("access_token") or resp_json.get("token")
    assert token is not None, "No token received on login"
    return token


def test_getapicompetitorstrackingbyid():
    token = get_auth_token()

    competitor_data = {
        "name": "Test Competitor",
        "url": "https://www.testcompetitor.com",
        "category": "electronics",
        "tracking_parameters": {
            "frequency": "daily",
            "metrics": ["price", "availability"]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    create_resp = requests.post(
        f"{BASE_URL}/api/competitors/tracking",
        json=competitor_data,
        headers=headers,
        timeout=TIMEOUT
    )
    try:
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        created_record = create_resp.json()
        tracking_id = created_record.get("id")
        assert tracking_id is not None, "Created tracking record has no 'id' field"

        get_resp = requests.get(
            f"{BASE_URL}/api/competitors/tracking/{tracking_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Expected 200 OK, got {get_resp.status_code}"
        fetched_record = get_resp.json()
        assert fetched_record.get("id") == tracking_id, "Fetched record ID does not match requested ID"
        assert fetched_record.get("name") == competitor_data["name"], "Fetched name does not match"
        assert fetched_record.get("url") == competitor_data["url"], "Fetched url does not match"
        assert fetched_record.get("category") == competitor_data["category"], "Fetched category does not match"
        assert fetched_record.get("tracking_parameters") == competitor_data["tracking_parameters"], "Fetched tracking parameters do not match"

    finally:
        if 'tracking_id' in locals():
            requests.delete(
                f"{BASE_URL}/api/competitors/tracking/{tracking_id}",
                headers=headers,
                timeout=TIMEOUT
            )


test_getapicompetitorstrackingbyid()
