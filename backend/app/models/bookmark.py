from sqlalchemy import Column, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

class Bookmark(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bookmarks"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User")
    lesson = relationship("Lesson")

    __table_args__ = (
        Index("ix_bookmarks_user_id", "user_id"),
        Index("ix_bookmarks_lesson_id", "lesson_id"),
    )
