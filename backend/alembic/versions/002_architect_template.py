"""Add architect template, bridge, and project tables.

Revision ID: 002_architect
Revises: 001_initial
Create Date: 2026-03-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "002_architect"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enums ---
    template_category = sa.Enum("architect", "general", "customer_support", "sales", name="templatecategory", create_type=True)
    bridge_device_status = sa.Enum("pending", "connected", "disconnected", "revoked", name="bridgedevicestatus", create_type=True)
    bridge_action_status = sa.Enum("pending", "sent", "executing", "completed", "failed", "cancelled", name="bridgeactionstatus", create_type=True)
    project_version_status = sa.Enum("draft", "saved", "exported", name="projectversionstatus", create_type=True)

    # --- assistant_templates ---
    op.create_table(
        "assistant_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", template_category, nullable=False, server_default="general"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), server_default="bot"),
        sa.Column("default_objective", sa.Text, nullable=False),
        sa.Column("default_tone", sa.String(100), server_default="professional"),
        sa.Column("default_language", sa.String(10), server_default="fr"),
        sa.Column("default_custom_rules", sa.Text, nullable=True),
        sa.Column("system_prompt_template", sa.Text, nullable=False),
        sa.Column("checklist_questions", JSONB, nullable=True),
        sa.Column("default_channels", JSONB, nullable=True),
        sa.Column("required_bridge", sa.String(50), nullable=True),
        sa.Column("metadata_json", JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("is_builtin", sa.Boolean, server_default="true"),
    )

    # --- bridge_devices ---
    op.create_table(
        "bridge_devices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_name", sa.String(255), nullable=False),
        sa.Column("device_os", sa.String(50), server_default="windows"),
        sa.Column("bridge_version", sa.String(50), nullable=True),
        sa.Column("device_token_hash", sa.String(255), nullable=False),
        sa.Column("status", bridge_device_status, server_default="pending"),
        sa.Column("blender_version", sa.String(50), nullable=True),
        sa.Column("blender_path", sa.String(500), nullable=True),
        sa.Column("permissions", JSONB, nullable=True),
        sa.Column("last_heartbeat", sa.String(50), nullable=True),
        sa.Column("connection_method", sa.String(50), server_default="websocket"),
    )
    op.create_index("ix_bridge_devices_workspace_id", "bridge_devices", ["workspace_id"])
    op.create_index("ix_bridge_devices_user_id", "bridge_devices", ["user_id"])
    op.create_index("ix_bridge_devices_assistant_id", "bridge_devices", ["assistant_id"])

    # --- bridge_actions ---
    op.create_table(
        "bridge_actions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("bridge_devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("conversation_id", UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action_type", sa.String(100), nullable=False),
        sa.Column("parameters", JSONB, nullable=True),
        sa.Column("status", bridge_action_status, server_default="pending"),
        sa.Column("result", JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("requires_approval", sa.Boolean, server_default="true"),
        sa.Column("approved_by_user", sa.Boolean, nullable=True),
    )
    op.create_index("ix_bridge_actions_device_id", "bridge_actions", ["device_id"])
    op.create_index("ix_bridge_actions_assistant_id", "bridge_actions", ["assistant_id"])

    # --- architect_projects ---
    op.create_table(
        "architect_projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("assistant_id", UUID(as_uuid=True), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("brief", sa.Text, nullable=True),
        sa.Column("status", project_version_status, server_default="draft"),
        sa.Column("checklist_answers", JSONB, nullable=True),
        sa.Column("references", JSONB, nullable=True),
        sa.Column("current_step", sa.Integer, server_default="0"),
        sa.Column("action_plan", JSONB, nullable=True),
        sa.Column("outputs", JSONB, nullable=True),
    )
    op.create_index("ix_architect_projects_assistant_id", "architect_projects", ["assistant_id"])
    op.create_index("ix_architect_projects_workspace_id", "architect_projects", ["workspace_id"])

    # --- project_versions ---
    op.create_table(
        "project_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("architect_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_number", sa.Integer, nullable=False),
        sa.Column("label", sa.String(255), nullable=True),
        sa.Column("blender_script", sa.Text, nullable=True),
        sa.Column("parameters", JSONB, nullable=True),
        sa.Column("outputs", JSONB, nullable=True),
    )
    op.create_index("ix_project_versions_project_id", "project_versions", ["project_id"])


def downgrade() -> None:
    op.drop_table("project_versions")
    op.drop_table("architect_projects")
    op.drop_table("bridge_actions")
    op.drop_table("bridge_devices")
    op.drop_table("assistant_templates")

    op.execute("DROP TYPE IF EXISTS projectversionstatus")
    op.execute("DROP TYPE IF EXISTS bridgeactionstatus")
    op.execute("DROP TYPE IF EXISTS bridgedevicestatus")
    op.execute("DROP TYPE IF EXISTS templatecategory")
