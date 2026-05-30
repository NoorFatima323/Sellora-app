import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_analysis_with_valid_payload():
    url = f"{BASE_URL}/api/analysis"
    headers = {
        "Content-Type": "application/json"
    }
    # Example of a valid analysis payload, assuming typical analysis fields
    payload = {
        "text": "Analyze the sales trend for Q1 2026",
        "parameters": {
            "language": "en",
            "detailed": True
        }
    }

    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        data = response.json()
        # Validate that analysis result is present
        assert "result" in data, "Response JSON does not contain 'result'"
        assert isinstance(data["result"], (dict, list, str)), "'result' field is not valid"

        # Validate that an identifier is returned for later retrieval
        assert "id" in data, "Response JSON does not contain 'id'"
        analysis_id = data["id"]

        # Confirm stored analysis by retrieving it
        get_url = f"{BASE_URL}/api/analysis/{analysis_id}"
        get_response = requests.get(get_url, headers=headers, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"GET /api/analysis/{analysis_id} failed with status {get_response.status_code}"
        stored_data = get_response.json()
        assert stored_data["id"] == analysis_id, "Stored analysis ID mismatch"
        assert "result" in stored_data, "Stored analysis missing 'result' field"
    finally:
        # Attempt to delete the created analysis resource if supported
        if response and response.status_code == 200:
            try:
                requests.delete(f"{BASE_URL}/api/analysis/{analysis_id}", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass

test_post_api_analysis_with_valid_payload()