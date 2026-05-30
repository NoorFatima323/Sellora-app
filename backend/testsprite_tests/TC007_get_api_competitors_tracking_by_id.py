import requests

endpoint = "http://localhost:8000"
timeout = 30

def test_get_api_competitors_tracking_by_id():
    auth_url = f"{endpoint}/api/auth/login"
    tracking_url = f"{endpoint}/api/competitors/tracking"

    # Credentials for authentication (assumed valid user for test)
    credentials = {
        "email": "testuser@example.com",
        "password": "testpassword"
    }

    # Sample competitor tracking payload for creation
    tracking_payload = {
        "competitor_name": "CompetitorX",
        "tracking_details": "Tracking details example",
        "product_id": "12345",
        "notes": "Initial test note"
    }

    headers = {"Content-Type": "application/json"}

    try:
        # Authenticate and get token
        auth_resp = requests.post(auth_url, json=credentials, headers=headers, timeout=timeout)
        assert auth_resp.status_code == 200, f"Auth failed with status {auth_resp.status_code}"
        token = auth_resp.json().get("access_token")
        assert token, "Authentication token not found in response"

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Create a competitor tracking record to get a valid id
        create_resp = requests.post(tracking_url, json=tracking_payload, headers=auth_headers, timeout=timeout)
        assert create_resp.status_code == 201, f"Create tracking record failed with status {create_resp.status_code}"
        created_data = create_resp.json()
        tracking_id = created_data.get("id")
        assert tracking_id, "Created tracking record ID missing"

        # Retrieve the tracking record by ID
        get_resp = requests.get(f"{tracking_url}/{tracking_id}", headers=auth_headers, timeout=timeout)
        assert get_resp.status_code == 200, f"Get tracking record by ID failed with status {get_resp.status_code}"
        get_data = get_resp.json()

        # Validate fields in retrieved data
        assert get_data.get("id") == tracking_id, "Mismatch in tracking record ID"
        assert get_data.get("competitor_name") == tracking_payload["competitor_name"], "Competitor name mismatch"
        assert "tracking_details" in get_data, "Tracking details missing in response"

    finally:
        # Cleanup: delete the created tracking record if it exists
        if 'tracking_id' in locals():
            requests.delete(f"{tracking_url}/{tracking_id}", headers=auth_headers, timeout=timeout)

test_get_api_competitors_tracking_by_id()
