from sqlalchemy import Column, ForeignKey, String, DateTime, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin

class SearchHistory(Base, UUIDMixin):
    __tablename__ = "search_histories"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String, nullable=False)
    searched_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")

    __table_args__ = (
        Index("ix_search_histories_user_id", "user_id"),
    )
