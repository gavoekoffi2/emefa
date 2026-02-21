"""Knowledge Base models - RAG pipeline entities."""

import enum
import uuid
from typing import Optional

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class KBSourceType(str, enum.Enum):
    FILE = "file"       # PDF, DOC, TXT upload
    URL = "url"         # website crawl
    TEXT = "text"       # pasted text


class KBStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class KnowledgeBase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "knowledge_bases"

    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[KBSourceType] = mapped_column(SAEnum(KBSourceType), nullable=False)
    status: Mapped[KBStatus] = mapped_column(SAEnum(KBStatus), default=KBStatus.PENDING)

    # For FILE: S3 key; For URL: the URL; For TEXT: null
    source_ref: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # For TEXT type, store raw content
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Qdrant collection name (scoped to assistant)
    collection_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Stats
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    assistant = relationship("Assistant", back_populates="knowledge_bases")
