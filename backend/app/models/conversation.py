"""Conversation and Message models - chat history + memory."""

import enum
import uuid
from typing import Optional

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class ChannelType(str, enum.Enum):
    WEB = "web"
    VOICE = "voice"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class Conversation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "conversations"

    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    channel: Mapped[ChannelType] = mapped_column(SAEnum(ChannelType), default=ChannelType.WEB)
    external_chat_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    assistant = relationship("Assistant", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan",
                            order_by="Message.created_at")


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MessageRole] = mapped_column(SAEnum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0)

    # RAG citations
    sources: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Tool call info
    tool_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tool_input: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    tool_output: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class Memory(Base, UUIDMixin, TimestampMixin):
    """Long-term memory per assistant - facts, preferences, key info."""
    __tablename__ = "memories"

    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="fact")
    content: Mapped[str] = mapped_column(Text, nullable=False)  # encrypted at rest
    importance: Mapped[int] = mapped_column(Integer, default=5)  # 1-10
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    assistant = relationship("Assistant", back_populates="memories")
