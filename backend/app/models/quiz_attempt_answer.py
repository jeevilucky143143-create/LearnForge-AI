from sqlalchemy import Column, String, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

class QuizAttemptAnswer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quiz_attempt_answers"

    attempt_id = Column(UUID(as_uuid=True), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_answer = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=False, default=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion")

    __table_args__ = (
        Index("ix_quiz_attempt_answers_attempt_id", "attempt_id"),
        Index("ix_quiz_attempt_answers_question_id", "question_id"),
    )
