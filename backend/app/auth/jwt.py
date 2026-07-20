from jose import jwt, JWTError
from app.core.config import settings

def verify_jwt(token: str) -> dict:
    """Verify and decode a Supabase JWT token using the HS256 secret.
    Returns the decoded token payload dictionary on success, or raises JWTError.
    """
    try:
        # In Supabase, the aud claim is typically "authenticated"
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise e
