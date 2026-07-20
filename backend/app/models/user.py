"""User model."""

from sqlalchemy import Column, String, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    supabase_user_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    uploaded_pdfs = relationship("UploadedPDF", back_populates="user", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_email", "email"),
    )

