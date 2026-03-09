"""Template and Bridge schemas."""

from typing import Optional

from pydantic import BaseModel


# ── Templates ────────────────────────────────────────────────────────

class TemplateResponse(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None
    icon: str
    default_objective: str
    default_tone: str
    default_language: str
    default_custom_rules: Optional[str] = None
    checklist_questions: Optional[list[dict]] = None
    required_bridge: Optional[str] = None
    metadata_json: Optional[dict] = None
    is_active: bool

    model_config = {"from_attributes": True}


class TemplateCreateAssistant(BaseModel):
    """Create an assistant from a template."""
    template_id: str
    name: str
    language: str = "fr"
    custom_rules: Optional[str] = None


# ── Bridge Devices ───────────────────────────────────────────────────

class BridgeDeviceRegister(BaseModel):
    assistant_id: str
    device_name: str
    device_os: str = "windows"
    blender_version: Optional[str] = None
    blender_path: Optional[str] = None
    connection_method: str = "websocket"


class BridgeDeviceResponse(BaseModel):
    id: str
    assistant_id: str
    device_name: str
    device_os: str
    bridge_version: Optional[str] = None
    blender_version: Optional[str] = None
    status: str
    permissions: Optional[dict] = None
    last_heartbeat: Optional[str] = None
    connection_method: str
    created_at: str

    model_config = {"from_attributes": True}


class BridgeDeviceToken(BaseModel):
    device_id: str
    device_token: str
    websocket_url: str


class BridgePermissionUpdate(BaseModel):
    permissions: dict  # {"open_blender": true, "import_image": true, "create_mesh": true, "export": true}


# ── Bridge Actions ───────────────────────────────────────────────────

class BridgeActionRequest(BaseModel):
    device_id: str
    action_type: str  # create_object, import_reference, apply_material, render, export
    parameters: Optional[dict] = None
    requires_approval: bool = True


class BridgeActionResponse(BaseModel):
    id: str
    device_id: str
    action_type: str
    parameters: Optional[dict] = None
    status: str
    result: Optional[dict] = None
    error_message: Optional[str] = None
    requires_approval: bool
    approved_by_user: Optional[bool] = None
    created_at: str

    model_config = {"from_attributes": True}


class BridgeActionApproval(BaseModel):
    approved: bool


class BridgeActionResult(BaseModel):
    """Sent by the desktop bridge to report action completion."""
    status: str  # completed, failed
    result: Optional[dict] = None
    error_message: Optional[str] = None


# ── Architect Projects ───────────────────────────────────────────────

class ArchitectProjectCreate(BaseModel):
    assistant_id: str
    name: str
    description: Optional[str] = None
    brief: Optional[str] = None


class ArchitectProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brief: Optional[str] = None
    checklist_answers: Optional[dict] = None
    current_step: Optional[int] = None
    action_plan: Optional[dict] = None
    status: Optional[str] = None


class ArchitectProjectResponse(BaseModel):
    id: str
    assistant_id: str
    name: str
    description: Optional[str] = None
    brief: Optional[str] = None
    status: str
    checklist_answers: Optional[dict] = None
    references: Optional[list] = None
    current_step: int
    action_plan: Optional[dict] = None
    outputs: Optional[list] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ProjectVersionResponse(BaseModel):
    id: str
    project_id: str
    version_number: int
    label: Optional[str] = None
    blender_script: Optional[str] = None
    parameters: Optional[dict] = None
    outputs: Optional[list] = None
    created_at: str

    model_config = {"from_attributes": True}
