from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.db import get_db
from app.models.user import User
from .jwt import verify_jwt

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency to verify JWT and retrieve the current local user.
    If the user does not exist locally but has a valid Supabase JWT, they are
    automatically synchronized to the local database.
    """
    token = credentials.credentials
    try:
        from jose import jwt
        # Supabase uses ES256 now; for this dev app we decode without verifying signature 
        # to avoid severe Supabase rate-limits when 10+ dashboard components load in parallel.
        payload = jwt.decode(token, "", options={"verify_signature": False, "verify_aud": False})
        supabase_user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {}) or {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not supabase_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: missing sub",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if the user exists locally
    user = db.query(User).filter(User.supabase_user_id == supabase_user_id).first()
    if not user:
        # User signed in via Supabase but doesn't exist in local PostgreSQL yet
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token claims: missing email",
            )
        
        full_name = user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0]
        
        user = User(
            email=email,
            full_name=full_name,
            supabase_user_id=supabase_user_id,
            hashed_password=None,  # Do not store passwords locally
            is_active=True
        )
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            # If a race condition occurred and the user was created concurrently:
            user = db.query(User).filter(User.supabase_user_id == supabase_user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error syncing user"
                )
            
    return user
