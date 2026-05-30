# check_supabase.py
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    print("=== Sellora Supabase Connection Diagnostics ===")
    
    # 1. Load environment variables
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        print(f"ERROR: .env file not found at {env_path}")
        sys.exit(1)
        
    load_dotenv(env_path)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"Target URL: {url}")
    print(f"Anon Key present: {'Yes' if anon_key else 'No'}")
    print(f"Service Key present: {'Yes' if service_key else 'No'}")
    
    if not url or not anon_key:
        print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is missing from .env")
        sys.exit(1)
        
    # 2. Initialize Client
    try:
        print("\nInitializing Supabase Client...")
        # Use anon key to test general accessibility
        supabase: Client = create_client(url, anon_key)
        print("Client initialized successfully.")
    except Exception as e:
        print(f"CRITICAL: Failed to initialize Supabase client: {e}")
        sys.exit(1)
        
    # 3. Test Query
    try:
        print("\nAttempting to query 'users' table...")
        response = supabase.table("users").select("count", count="exact").limit(1).execute()
        print(f"SUCCESS: Successfully queried the database!")
        print(f"Response Data: {response.data}")
        print(f"Total Rows: {response.count}")
    except Exception as e:
        print(f"\nWARNING: Query to 'users' table failed: {e}")
        print("This could be because the table schema has not been applied yet.")
        
        # Fallback to test general API connection by trying to fetch API schema or options
        try:
            print("\nAttempting basic HTTP request to Supabase API root...")
            import httpx
            r = httpx.get(f"{url}/rest/v1/", headers={"apikey": anon_key})
            print(f"HTTP Status: {r.status_code}")
            if r.status_code == 200:
                print("SUCCESS: Supabase API is reachable and key is valid!")
            else:
                print(f"FAILED: Reachability check returned {r.status_code}: {r.text}")
        except Exception as ex:
            print(f"ERROR: Basic HTTP reachability check failed: {ex}")

if __name__ == "__main__":
    main()
