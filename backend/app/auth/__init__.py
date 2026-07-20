# Authentication package initializer

"""Expose authentication utilities for import.
"""

from .supabase_client import supabase
from .jwt import verify_jwt
from .dependencies import get_current_user
from .routes import router as auth_router
