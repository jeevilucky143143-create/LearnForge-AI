"""Quiz model."""

from sqlalchemy import Column, String, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

class Quiz(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quizzes"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=True, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)

    course = relationship("Course", back_populates="quiz")
    chapter = relationship("Chapter")
    lesson = relationship("Lesson")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_quizzes_course_id", "course_id"),
        Index("ix_quizzes_chapter_id", "chapter_id"),
        Index("ix_quizzes_lesson_id", "lesson_id"),
    )
