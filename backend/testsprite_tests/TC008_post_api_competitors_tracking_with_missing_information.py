import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_competitors_tracking_with_missing_information():
    url = f"{BASE_URL}/api/competitors/tracking"
    # Send payload with missing competitor information (empty payload)
    payload = {}
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    
test_post_api_competitors_tracking_with_missing_information()