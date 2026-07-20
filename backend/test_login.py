import os
import asyncio
from dotenv import load_dotenv
load_dotenv(".env")
from supabase import create_client, Client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

res = supabase.auth.sign_in_with_password({
    "email": "jeevilucky2020@gmail.com",
    "password": "Jeevi#2005"
})

print("Token:")
print(res.session.access_token[:20] if res.session else "No session")

import jwt
secret = os.getenv("SUPABASE_JWT_SECRET")
try:
    decoded = jwt.decode(res.session.access_token, secret, algorithms=["HS256"], options={"verify_aud": False})
    print("Decoded perfectly!")
except Exception as e:
    print(f"Error decoding: {e}")
