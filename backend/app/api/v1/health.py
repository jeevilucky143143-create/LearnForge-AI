import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db
from app.auth.supabase_client import supabase
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])

@router.get("", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint checking database and storage bucket connectivity."""
    db_status = "unhealthy"
    storage_status = "unhealthy"

    # 1. Test Database
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Health check: Database connection failed: {e}")

    # 2. Test Storage Bucket
    try:
        # Fetch bucket list to verify service key & URL validity
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if settings.SUPABASE_STORAGE_BUCKET in bucket_names:
            storage_status = "healthy"
        else:
            logger.error(f"Health check: Storage bucket '{settings.SUPABASE_STORAGE_BUCKET}' not found.")
    except Exception as e:
        logger.error(f"Health check: Storage connection failed: {e}")

    overall = "healthy" if db_status == "healthy" and storage_status == "healthy" else "unhealthy"
    
    return {
        "status": overall,
        "database": db_status,
        "storage": storage_status
    }
