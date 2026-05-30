import requests
import time

# Give the server a moment to start
time.sleep(2)

url = "http://127.0.0.1:8000/api/auth/register"
data = {
    "email": "testqa@sellora.com",
    "password": "password123",
    "name": "QA Tester"
}
try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
