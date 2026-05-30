import requests

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
MY_REPORTS_ENDPOINT = "/api/analysis/my-reports"
TIMEOUT = 30

def test_get_api_analysis_my_reports():
    login_payload = {
        "email": "testqa@sellora.com",
        "password": "password123"
    }
    try:
        # Login to get JWT token
        login_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        token = login_data.get("access_token") or login_data.get("token")
        assert token is not None, "JWT token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Access my reports endpoint
        reports_response = requests.get(
            BASE_URL + MY_REPORTS_ENDPOINT,
            headers=headers,
            timeout=TIMEOUT
        )
        assert reports_response.status_code == 200, f"My reports request failed with status {reports_response.status_code}"
        reports_data = reports_response.json()
        # Assert the response JSON contains expected structure (list or dict)
        assert isinstance(reports_data, (dict, list)), "Expected JSON response to be list or dict"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_analysis_my_reports()
