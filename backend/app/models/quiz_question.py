"""QuizQuestion model."""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, UUIDMixin, TimestampMixin
from .enums import QuizQuestionType

class QuizQuestion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quiz_questions"

    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    question_text = Column(String, nullable=False)
    question_type = Column(SAEnum(QuizQuestionType), nullable=False, default=QuizQuestionType.mcq)
    options = Column(Text, nullable=True)  # JSON-serialized list of option strings
    correct_answer = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    lesson = relationship("Lesson")

    __table_args__ = (
        Index("ix_quiz_questions_quiz_id", "quiz_id"),
    )
