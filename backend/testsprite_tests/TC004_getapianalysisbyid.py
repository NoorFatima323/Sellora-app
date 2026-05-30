import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_getapianalysisbyid():
    # Since no analysis ID is provided, create a new analysis first
    analysis_payload = {
        "title": "Test Analysis",
        "description": "This is a test analysis.",
        "data": {"key": "value"}
    }
    create_url = f"{BASE_URL}/api/analysis"
    headers = {"Content-Type": "application/json"}
    analysis_id = None

    try:
        # Create a new analysis
        create_resp = requests.post(create_url, json=analysis_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 200, f"Expected 200 on analysis creation, got {create_resp.status_code}"
        create_json = create_resp.json()
        assert "id" in create_json, "Response JSON does not contain 'id'"
        analysis_id = create_json["id"]

        # Retrieve the analysis by ID
        get_url = f"{BASE_URL}/api/analysis/{analysis_id}"
        get_resp = requests.get(get_url, headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 on analysis retrieval, got {get_resp.status_code}"

        get_json = get_resp.json()
        # Validate returned data matches created payload (at least title and description)
        assert get_json.get("id") == analysis_id, "Returned analysis ID does not match requested ID"
        assert get_json.get("title") == analysis_payload["title"], "Title does not match"
        assert get_json.get("description") == analysis_payload["description"], "Description does not match"
        assert isinstance(get_json.get("data"), dict), "Data field is not a dict"

    finally:
        if analysis_id:
            # Clean up by deleting the created analysis
            delete_url = f"{BASE_URL}/api/analysis/{analysis_id}"
            delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
            # We don't assert delete status here, just attempt cleanup

test_getapianalysisbyid()