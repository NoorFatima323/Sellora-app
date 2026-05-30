import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_competitorstracking_with_missing_details():
    url = f"{BASE_URL}/api/competitors/tracking"
    headers = {
        "Content-Type": "application/json",
    }
    # Missing competitor information - empty payload or incomplete fields
    payload = {
        # assuming some required fields like 'competitorName', 'trackingDetails' are missing
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
        # Optionally verify error detail structure if available
        json_response = response.json()
        assert "detail" in json_response, "Response JSON missing 'detail' field"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_post_api_competitorstracking_with_missing_details()