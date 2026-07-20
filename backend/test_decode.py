import jwt, os
from dotenv import load_dotenv
load_dotenv(".env")
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

res = supabase.auth.sign_in_with_password({"email": "jeevilucky2020@gmail.com", "password": "Jeevi#2005"})

token = res.session.access_token
print("Header:", jwt.get_unverified_header(token))
print("Claims:", jwt.get_unverified_claims(token))
