import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_competitors_tracking_with_valid_details():
    url = f"{BASE_URL}/api/competitors/tracking"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "competitor_name": "Acme Corp",
        "product": "Acme Widget",
        "tracking_start_date": "2026-01-01",
        "notes": "Initial tracking record"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created but got {response.status_code}"

        data = response.json()
        assert "id" in data, "Response JSON missing 'id' field"
        assert data["competitor_name"] == payload["competitor_name"], "Competitor name mismatch"
        assert data["product"] == payload["product"], "Product mismatch"
        assert "tracking_start_date" in data, "tracking_start_date missing in response"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_post_api_competitors_tracking_with_valid_details()