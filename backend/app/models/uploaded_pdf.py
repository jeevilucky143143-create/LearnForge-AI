import enum
from sqlalchemy import Column, String, Integer, Enum as SAEnum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

class PDFStatus(enum.Enum):
    pending = "pending"
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class UploadedPDF(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "uploaded_pdfs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=True) # Adding original_filename just to be safe
    storage_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=False, default="application/pdf")
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=True)
    status = Column(SAEnum(PDFStatus), nullable=False, default=PDFStatus.pending)
    error_message = Column(Text, nullable=True)
    # optional relation to generated course
    course = relationship("Course", back_populates="uploaded_pdf", uselist=False, cascade="all, delete-orphan")

    user = relationship("User", back_populates="uploaded_pdfs")

    __table_args__ = (
        Index("ix_uploaded_pdfs_user_id", "user_id"),
    )
