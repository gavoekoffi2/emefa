"""Template and Bridge models - architect assistant infrastructure."""

import enum
import uuid
from typing import Optional

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class TemplateCategory(str, enum.Enum):
    ARCHITECT = "architect"
    GENERAL = "general"
    CUSTOMER_SUPPORT = "customer_support"
    SALES = "sales"


class AssistantTemplate(Base, UUIDMixin, TimestampMixin):
    """Pre-configured assistant templates (e.g., Architect)."""
    __tablename__ = "assistant_templates"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[TemplateCategory] = mapped_column(
        SAEnum(TemplateCategory), default=TemplateCategory.GENERAL
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="bot")

    # Template configuration
    default_objective: Mapped[str] = mapped_column(Text, nullable=False)
    default_tone: Mapped[str] = mapped_column(String(100), default="professional")
    default_language: Mapped[str] = mapped_column(String(10), default="fr")
    default_custom_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    system_prompt_template: Mapped[str] = mapped_column(Text, nullable=False)

    # Checklist of questions the assistant asks the user
    checklist_questions: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Channel defaults
    default_channels: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Required bridge type (null = no bridge needed)
    required_bridge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Template metadata (supported file types, export formats, etc.)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=True)


class BridgeDeviceStatus(str, enum.Enum):
    PENDING = "pending"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    REVOKED = "revoked"


class BridgeDevice(Base, UUIDMixin, TimestampMixin):
    """Desktop bridge device registration - tracks user's local Blender installations."""
    __tablename__ = "bridge_devices"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    device_name: Mapped[str] = mapped_column(String(255), nullable=False)
    device_os: Mapped[str] = mapped_column(String(50), default="windows")  # windows, linux, macos
    bridge_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Auth
    device_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[BridgeDeviceStatus] = mapped_column(
        SAEnum(BridgeDeviceStatus), default=BridgeDeviceStatus.PENDING
    )

    # Capabilities
    blender_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    blender_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Permissions (explicit user grants)
    permissions: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    # Connection info
    last_heartbeat: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    connection_method: Mapped[str] = mapped_column(String(50), default="websocket")  # websocket, tailscale, mcp

    # Relationships
    workspace = relationship("Workspace")
    user = relationship("User")
    assistant = relationship("Assistant")


class BridgeActionStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BridgeAction(Base, UUIDMixin, TimestampMixin):
    """Individual commands sent to the desktop bridge."""
    __tablename__ = "bridge_actions"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bridge_devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    conversation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )

    # Command details
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)  # create_object, apply_material, render, export, etc.
    parameters: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    status: Mapped[BridgeActionStatus] = mapped_column(
        SAEnum(BridgeActionStatus), default=BridgeActionStatus.PENDING
    )

    # Result
    result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Approval tracking (coaching mode)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by_user: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Relationships
    device = relationship("BridgeDevice")
    assistant = relationship("Assistant")


class ProjectVersionStatus(str, enum.Enum):
    DRAFT = "draft"
    SAVED = "saved"
    EXPORTED = "exported"


class ArchitectProject(Base, UUIDMixin, TimestampMixin):
    """Architect project - groups conversations, actions, and outputs."""
    __tablename__ = "architect_projects"

    assistant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    brief: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # architect's text brief

    # Status tracking
    status: Mapped[ProjectVersionStatus] = mapped_column(
        SAEnum(ProjectVersionStatus), default=ProjectVersionStatus.DRAFT
    )

    # Checklist answers (from template questions)
    checklist_answers: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # References (uploaded plans, photos, inspiration images)
    references: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)

    # Current step in the workflow
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    action_plan: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Output files (S3 keys for .blend, .glb, .fbx, .png renders)
    outputs: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)

    # Relationships
    assistant = relationship("Assistant")
    workspace = relationship("Workspace")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")


class ProjectVersion(Base, UUIDMixin, TimestampMixin):
    """Version history for architect projects."""
    __tablename__ = "project_versions"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("architect_projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Snapshot
    blender_script: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parameters: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    outputs: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)

    # Relationships
    project = relationship("ArchitectProject", back_populates="versions")
