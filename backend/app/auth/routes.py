from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from .supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user through Supabase Auth and synchronize with local database.
    """
    try:
        # Sign up with Supabase Auth
        res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name
                }
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supabase registration failed: {str(e)}"
        )
    
    if not res.session or not res.user:
        # Email verification might be enabled in Supabase
        raise HTTPException(
            status_code=status.HTTP_200_OK,  # Or 201
            detail="Registration successful. Please check your email to verify your account before logging in."
        )

    supabase_user_id = res.user.id

    # Create local User record
    existing_user = db.query(User).filter(User.supabase_user_id == supabase_user_id).first()
    if not existing_user:
        local_user = User(
            email=payload.email,
            full_name=payload.full_name,
            supabase_user_id=supabase_user_id,
            hashed_password=None,  # No local password storage
            is_active=True
        )
        try:
            db.add(local_user)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error syncing user to database: {str(e)}"
            )

    return {
        "access_token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
        "user_id": str(supabase_user_id),
        "email": res.user.email
    }

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Log in an existing user through Supabase Auth.
    """
    try:
        res = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )

    if not res.session or not res.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or session not established."
        )

    supabase_user_id = res.user.id

    # Ensure local User record exists
    local_user = db.query(User).filter(User.supabase_user_id == supabase_user_id).first()
    if not local_user:
        # Create local user on demand (for example if they registered externally)
        user_metadata = res.user.user_metadata or {}
        full_name = user_metadata.get("full_name") or user_metadata.get("name") or payload.email.split("@")[0]
        local_user = User(
            email=payload.email,
            full_name=full_name,
            supabase_user_id=supabase_user_id,
            hashed_password=None,
            is_active=True
        )
        try:
            db.add(local_user)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error syncing user to database: {str(e)}"
            )

    return {
        "access_token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
        "user_id": str(supabase_user_id),
        "email": res.user.email
    }

@router.post("/logout")
def logout():
    """Log out the current user session.
    """
    try:
        supabase.auth.sign_out()
    except Exception:
        pass  # Ignore sign_out errors on backend
    return {"detail": "Logged out successfully"}
