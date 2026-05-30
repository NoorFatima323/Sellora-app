import requests

BASE_URL = "http://localhost:8000"

def test_get_api_competitor_track():
    url = f"{BASE_URL}/api/competitor/track"
    params = {
        "product_name": "SampleProduct",
        "base_price": "100"
    }
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    data = response.json()
    assert isinstance(data, dict) or isinstance(data, list), "Response JSON should be dict or list"
    # Additional validation can be done here depending on expected schema

test_get_api_competitor_track()