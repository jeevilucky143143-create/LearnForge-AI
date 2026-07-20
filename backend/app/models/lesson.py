"""Lesson model."""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin

class Lesson(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lessons"

    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)

    chapter = relationship("Chapter", back_populates="lessons")
    progress = relationship("LearningProgress", back_populates="lesson", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_lessons_chapter_id", "chapter_id"),
    )
