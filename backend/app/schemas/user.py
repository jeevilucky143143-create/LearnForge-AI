from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    supabase_user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    full_name: str
