import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_analysis_with_malformed_payload():
    url = f"{BASE_URL}/api/analysis"
    # Malformed payload missing required fields or incomplete data
    malformed_payload = {
        # Assuming the valid payload requires certain fields,
        # here we provide a payload that's clearly incomplete or malformed.
        "unexpected_field": "unexpected_value"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=malformed_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    # Assert that the status code is 422 Unprocessable Entity
    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"

    # Assert response includes validation error details (optional - based on FastAPI default)
    json_response = {}
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "detail" in json_response, "Response JSON does not contain 'detail' key indicating validation errors"

test_post_api_analysis_with_malformed_payload()