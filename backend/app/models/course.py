"""Course model."""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin
from .enums import DifficultyLevel

class Course(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "courses"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_pdf_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_pdfs.id", ondelete="SET NULL"), nullable=True, unique=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    learning_objectives = Column(Text, nullable=True)  # could be JSON string
    prerequisites = Column(Text, nullable=True)      # could be JSON string
    difficulty = Column(SAEnum(DifficultyLevel), nullable=False, default=DifficultyLevel.beginner)

    user = relationship("User", back_populates="courses")
    uploaded_pdf = relationship("UploadedPDF", back_populates="course", uselist=False)
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")
    quiz = relationship("Quiz", back_populates="course", uselist=False, cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="course", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_courses_user_id", "user_id"),
    )
