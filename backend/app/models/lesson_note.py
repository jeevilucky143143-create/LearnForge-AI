from sqlalchemy import Column, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

class LessonNote(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lesson_notes"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    markdown = Column(Text, nullable=False)

    user = relationship("User")
    lesson = relationship("Lesson")

    __table_args__ = (
        Index("ix_lesson_notes_user_id", "user_id"),
        Index("ix_lesson_notes_lesson_id", "lesson_id"),
    )
