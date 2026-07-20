"""ChatHistory model."""

from sqlalchemy import Column, Text, Enum as SAEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin
from .enums import ChatRole

class ChatHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chat_histories"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SAEnum(ChatRole), nullable=False)
    message = Column(Text, nullable=False)

    user = relationship("User", back_populates="chat_histories")
    course = relationship("Course", back_populates="chat_histories")

    __table_args__ = (
        Index("ix_chat_histories_user_id", "user_id"),
        Index("ix_chat_histories_course_id", "course_id"),
    )
