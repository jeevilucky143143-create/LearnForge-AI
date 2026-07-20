"""Chapter model."""

from sqlalchemy import Column, String, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin

class Chapter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chapters"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)

    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_chapters_course_id", "course_id"),
    )
