import requests

def test_post_api_analysis_with_malformed_payload():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/analysis"
    headers = {
        "Content-Type": "application/json"
    }

    # Malformed payload: empty dict to trigger 422
    malformed_payload = {}

    response = requests.post(url, json=malformed_payload, headers=headers, timeout=30)
    assert response.status_code == 422, f"Expected 422 for empty payload, got {response.status_code}"

test_post_api_analysis_with_malformed_payload()