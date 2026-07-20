"""LearningProgress model."""

from sqlalchemy import Column, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin

class LearningProgress(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "learning_progress"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_opened_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="learning_progress")
    lesson = relationship("Lesson", back_populates="progress")

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_learning_progress_user_lesson"),
        Index("ix_learning_progress_user_id", "user_id"),
        Index("ix_learning_progress_lesson_id", "lesson_id"),
    )
