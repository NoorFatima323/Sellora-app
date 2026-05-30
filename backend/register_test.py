import requests

url = "http://127.0.0.1:8000/api/auth/register"
data = {
    "email": "test@sellora.com",
    "password": "password123",
    "name": "Test User"
}
try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
