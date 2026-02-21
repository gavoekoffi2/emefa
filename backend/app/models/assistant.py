"""Assistant model - the core entity users create and configure."""

import enum
import uuid
from typing import Optional

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class AssistantStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"


class Assistant(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assistants"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objective: Mapped[str] = mapped_column(Text, nullable=False)  # user's plain-text objective
    tone: Mapped[str] = mapped_column(String(100), default="professional")
    language: Mapped[str] = mapped_column(String(10), default="fr")
    custom_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Auto-generated system prompt (from objective + tone + rules + security)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[AssistantStatus] = mapped_column(
        SAEnum(AssistantStatus), default=AssistantStatus.DRAFT
    )

    # LLM provider override (null = use workspace/global default)
    llm_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    llm_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Channels config
    web_chat_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    telegram_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    telegram_bot_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # encrypted
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    whatsapp_phone_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    whatsapp_qr_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Actions/tools config
    enabled_actions: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    # Token usage tracking
    total_tokens_used: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    workspace = relationship("Workspace", back_populates="assistants")
    knowledge_bases = relationship("KnowledgeBase", back_populates="assistant", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="assistant", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="assistant", cascade="all, delete-orphan")
