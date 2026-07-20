from jose import jwt
import os
from dotenv import load_dotenv
load_dotenv(".env")
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

res = supabase.auth.sign_in_with_password({"email": "jeevilucky2020@gmail.com", "password": "Jeevi#2005"})
token = res.session.access_token

try:
    payload = jwt.decode(token, "", options={"verify_signature": False, "verify_aud": False})
    print(payload)
except Exception as e:
    print(f"Error: {e}")
