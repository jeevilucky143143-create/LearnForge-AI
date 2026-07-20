import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Create a dedicated, stateless client for storage to avoid auth state pollution
storage_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def verify_storage_bucket():
    """Verify that the configured Supabase Storage bucket exists."""
    try:
        buckets = storage_client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if settings.SUPABASE_STORAGE_BUCKET not in bucket_names:
            logger.error(f"Supabase Storage Bucket '{settings.SUPABASE_STORAGE_BUCKET}' does not exist.")
            raise RuntimeError(f"Storage bucket '{settings.SUPABASE_STORAGE_BUCKET}' not configured.")
        logger.info(f"Verified storage bucket: {settings.SUPABASE_STORAGE_BUCKET}")
    except Exception as e:
        logger.error(f"Failed to verify storage bucket: {e}")
        raise RuntimeError(f"Storage bucket verification failed: {e}")

def upload_file(path: str, file_bytes: bytes, mime_type: str) -> bool:
    """Upload a file to Supabase Storage."""
    try:
        res = storage_client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            path,
            file_bytes,
            {"content-type": mime_type}
        )
        return True
    except Exception as e:
        logger.error(f"Error uploading file to storage: {e}")
        return False

def delete_file(path: str) -> bool:
    """Delete a file from Supabase Storage."""
    try:
        storage_client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([path])
        return True
    except Exception as e:
        logger.error(f"Error deleting file from storage: {e}")
        return False
