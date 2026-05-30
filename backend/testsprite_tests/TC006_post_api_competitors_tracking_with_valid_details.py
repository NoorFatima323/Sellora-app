import requests

BASE_URL = "http://localhost:8000"


def test_post_api_competitors_tracking_with_valid_details():
    url = f"{BASE_URL}/api/competitors/tracking"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "competitor_name": "CompetitorX",
        "product_url": "https://example.com/product/competitorx123",
        "tracking_details": {
            "category": "Electronics",
            "price": 199.99,
            "currency": "USD",
            "availability": "In Stock",
            "tags": ["new", "featured"]
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        # Assert status code 201 Created
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"

        data = response.json()
        # Validate response contains an id for tracking record
        assert "id" in data and isinstance(data["id"], (int, str)), "Response JSON does not have valid 'id' field"
        # Optional: Verify returned competitor_name matches input
        assert data.get("competitor_name") == payload["competitor_name"], "competitor_name in response does not match request"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_post_api_competitors_tracking_with_valid_details()