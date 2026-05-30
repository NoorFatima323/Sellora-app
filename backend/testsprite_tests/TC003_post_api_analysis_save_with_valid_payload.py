import requests

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
ANALYSIS_POST_URL = f"{BASE_URL}/api/analysis"
TIMEOUT = 30

def test_post_api_analysis_save_with_valid_payload():
    # Step 1: Login to get token
    login_payload = {
        "email": "testqa@sellora.com",
        "password": "password123"
    }
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed, expected 200 but got {login_response.status_code}"
        json_login = login_response.json()
        assert "access_token" in json_login, "access_token not found in login response"
        token = json_login["access_token"]
    except (requests.RequestException, AssertionError) as e:
        raise Exception(f"Login step failed: {str(e)}")

    # Step 2: Use token to post valid analysis payload
    analysis_payload = {
        "title": "Q2 Market Analysis",
        "description": "Comprehensive analysis of Q2 market trends",
        "data": {
            "regions": ["North America", "Europe"],
            "metrics": {
                "sales": 1000000,
                "growth_rate": 0.12
            }
        },
        "tags": ["market", "Q2", "sales"]
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        analysis_response = requests.post(ANALYSIS_POST_URL, json=analysis_payload, headers=headers, timeout=TIMEOUT)
        assert analysis_response.status_code == 200, f"Expected 200, got {analysis_response.status_code}"
    except (requests.RequestException, AssertionError) as e:
        raise Exception(f"Analysis save step failed: {str(e)}")

test_post_api_analysis_save_with_valid_payload()