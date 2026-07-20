"""QuizAttempt model."""

from sqlalchemy import Column, Integer, ForeignKey, Enum as SAEnum, Index, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin
from .enums import QuizStatus

class QuizAttempt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quiz_attempts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=True)
    percentage = Column(Float, nullable=True)
    status = Column(SAEnum(QuizStatus), nullable=False, default=QuizStatus.in_progress)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True) # duration in seconds

    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("QuizAttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_quiz_attempts_user_id", "user_id"),
        Index("ix_quiz_attempts_quiz_id", "quiz_id"),
    )
