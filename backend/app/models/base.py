import uuid
import datetime as dt
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()

class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, unique=True, nullable=False)

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)
