import os
from dotenv import load_dotenv
from supabase import create_client
import bcrypt

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
print(f"New hash: {hashed}")

res = supabase.table("users").update({"password_hash": hashed}).eq("email", "test@sellora.com").execute()
print(f"Updated: {res.data}")
