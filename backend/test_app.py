# test_app.py
import sys
from fastapi.testclient import TestClient
from app.main import app

def main():
    print("=== Testing Sellora FastAPI Health Gateway ===")
    
    try:
        client = TestClient(app)
        print("FastAPI app successfully initialized and TestClient created.")
    except Exception as e:
        print(f"CRITICAL: FastAPI initialization failed: {e}")
        sys.exit(1)
        
    try:
        print("Calling GET /api/health ...")
        response = client.get("/api/health")
        print(f"Response Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
        
        status_data = response.json()
        if status_data.get("db") == "connected":
            print("\nSUCCESS: Database connection verified successfully!")
        else:
            print("\nWARNING: Backend initialized, but database connection could not be fully verified.")
            
    except Exception as e:
        print(f"ERROR: API call failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
