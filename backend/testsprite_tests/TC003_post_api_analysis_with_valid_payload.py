import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_analysis_with_valid_payload():
    url = f"{BASE_URL}/api/analysis"
    headers = {
        "Content-Type": "application/json"
    }

    # Example of a valid analysis payload, assuming typical fields for analysis resource
    payload = {
        "name": "Market Trend Analysis",
        "description": "Analysis of market trends for Q2",
        "parameters": {
            "region": "North America",
            "sector": "Technology",
            "timeframe": "Q2-2026"
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    json_response = None
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Check that response contains an identifier and result of the analysis
    assert "id" in json_response, "Response JSON missing 'id'"
    assert "result" in json_response, "Response JSON missing 'result'"

    # Additional basic sanity checks on result
    result = json_response["result"]
    assert isinstance(result, dict) or isinstance(result, list) or isinstance(result, str), (
        "Result should be a dict, list or string"
    )

test_post_api_analysis_with_valid_payload()