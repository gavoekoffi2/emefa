"""Initial schema: users, workspaces, assistants, conversations, knowledge bases, audit logs.

Revision ID: 001_initial
Revises: None
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enums ---
    workspace_role = sa.Enum("owner", "admin", "member", name="workspacerole", create_type=True)
    assistant_status = sa.Enum("draft", "active", "paused", name="assistantstatus", create_type=True)
    channel_type = sa.Enum("web", "voice", "telegram", "whatsapp", name="channeltype", create_type=True)
    message_role = sa.Enum("user", "assistant", "system", "tool", name="messagerole", create_type=True)
    kb_source_type = sa.Enum("file", "url", "text", name="kbsourcetype", create_type=True)
    kb_status = sa.Enum("pending", "processing", "ready", "error", name="kbstatus", create_type=True)

    # --- workspaces ---
    op.create_table(
        "workspaces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("token_budget_daily", sa.Integer(), default=100_000),
        sa.Column("tokens_used_today", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.Text(), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("is_superadmin", sa.Boolean(), default=False),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- workspace_members ---
    op.create_table(
        "workspace_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", workspace_role, default="member", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_workspace_members_workspace_id", "workspace_members", ["workspace_id"])

    # --- refresh_tokens ---
    op.create_table(
        "refresh_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, index=True),
        sa.Column("is_revoked", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- assistants ---
    op.create_table(
        "assistants",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("objective", sa.Text(), nullable=False),
        sa.Column("tone", sa.String(100), default="professional"),
        sa.Column("language", sa.String(10), default="fr"),
        sa.Column("custom_rules", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=True),
        sa.Column("status", assistant_status, default="draft"),
        sa.Column("llm_provider", sa.String(50), nullable=True),
        sa.Column("llm_model", sa.String(100), nullable=True),
        sa.Column("web_chat_enabled", sa.Boolean(), default=True),
        sa.Column("voice_enabled", sa.Boolean(), default=False),
        sa.Column("telegram_enabled", sa.Boolean(), default=False),
        sa.Column("telegram_bot_token", sa.Text(), nullable=True),
        sa.Column("whatsapp_enabled", sa.Boolean(), default=False),
        sa.Column("whatsapp_phone_id", sa.String(100), nullable=True),
        sa.Column("whatsapp_qr_enabled", sa.Boolean(), default=False),
        sa.Column("enabled_actions", JSONB(), default={}),
        sa.Column("total_tokens_used", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- conversations ---
    op.create_table(
        "conversations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("channel", channel_type, default="web"),
        sa.Column("external_chat_id", sa.String(255), nullable=True, index=True),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("message_count", sa.Integer(), default=0),
        sa.Column("tokens_used", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- messages ---
    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", message_role, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), default=0),
        sa.Column("sources", JSONB(), nullable=True),
        sa.Column("tool_name", sa.String(100), nullable=True),
        sa.Column("tool_input", JSONB(), nullable=True),
        sa.Column("tool_output", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- memories ---
    op.create_table(
        "memories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.String(50), nullable=False, default="fact"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("importance", sa.Integer(), default=5),
        sa.Column("metadata_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- knowledge_bases ---
    op.create_table(
        "knowledge_bases",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("source_type", kb_source_type, nullable=False),
        sa.Column("status", kb_status, default="pending"),
        sa.Column("source_ref", sa.Text(), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("collection_name", sa.String(255), nullable=True),
        sa.Column("chunk_count", sa.Integer(), default=0),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(100), nullable=True),
        sa.Column("details", JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("knowledge_bases")
    op.drop_table("memories")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("assistants")
    op.drop_table("refresh_tokens")
    op.drop_table("workspace_members")
    op.drop_table("users")
    op.drop_table("workspaces")

    # Drop enums
    sa.Enum(name="kbstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="kbsourcetype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="messagerole").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="channeltype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="assistantstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="workspacerole").drop(op.get_bind(), checkfirst=True)
