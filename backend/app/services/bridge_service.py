"""Bridge service - manages desktop bridge devices, WebSocket connections, and Blender commands."""

import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.template import (
    BridgeAction,
    BridgeActionStatus,
    BridgeDevice,
    BridgeDeviceStatus,
)

settings = get_settings()

# ── In-memory WebSocket connections (production: use Redis pub/sub) ──
_active_connections: dict[str, object] = {}  # device_id -> WebSocket


# ── Blender Command Registry ────────────────────────────────────────

BLENDER_COMMANDS = {
    "create_object": {
        "description": "Créer un objet 3D dans Blender",
        "parameters": {
            "object_type": {"type": "string", "enum": ["cube", "sphere", "cylinder", "plane", "cone", "torus", "empty", "custom_mesh"]},
            "name": {"type": "string", "description": "Nom de l'objet"},
            "location": {"type": "array", "description": "[x, y, z] position", "default": [0, 0, 0]},
            "scale": {"type": "array", "description": "[x, y, z] scale", "default": [1, 1, 1]},
            "rotation": {"type": "array", "description": "[x, y, z] rotation en degrés", "default": [0, 0, 0]},
            "dimensions": {"type": "array", "description": "[largeur, profondeur, hauteur] en mètres", "optional": True},
        },
        "permission": "create_mesh",
    },
    "import_reference": {
        "description": "Importer une image de référence dans la scène Blender",
        "parameters": {
            "file_url": {"type": "string", "description": "URL de l'image à télécharger"},
            "name": {"type": "string", "description": "Nom de la référence"},
            "position": {"type": "string", "enum": ["front", "back", "left", "right", "top"], "default": "front"},
        },
        "permission": "import_image",
    },
    "apply_material": {
        "description": "Appliquer un matériau à un objet",
        "parameters": {
            "object_name": {"type": "string"},
            "material_type": {"type": "string", "enum": ["concrete", "wood", "glass", "metal", "stone", "brick", "custom"]},
            "color": {"type": "string", "description": "Hex color (#RRGGBB)", "optional": True},
            "roughness": {"type": "number", "description": "0.0-1.0", "default": 0.5},
            "metallic": {"type": "number", "description": "0.0-1.0", "default": 0.0},
        },
        "permission": "create_mesh",
    },
    "set_dimensions": {
        "description": "Définir les dimensions exactes d'un objet",
        "parameters": {
            "object_name": {"type": "string"},
            "width": {"type": "number", "description": "Largeur en mètres"},
            "depth": {"type": "number", "description": "Profondeur en mètres"},
            "height": {"type": "number", "description": "Hauteur en mètres"},
        },
        "permission": "create_mesh",
    },
    "setup_camera": {
        "description": "Positionner la caméra pour le rendu",
        "parameters": {
            "location": {"type": "array", "description": "[x, y, z]"},
            "target": {"type": "array", "description": "[x, y, z] point visé", "default": [0, 0, 0]},
            "focal_length": {"type": "number", "default": 50},
        },
        "permission": "create_mesh",
    },
    "setup_lighting": {
        "description": "Configurer l'éclairage de la scène",
        "parameters": {
            "preset": {"type": "string", "enum": ["studio", "outdoor_day", "outdoor_sunset", "interior", "custom"]},
            "sun_strength": {"type": "number", "default": 3.0},
            "ambient_strength": {"type": "number", "default": 0.5},
        },
        "permission": "create_mesh",
    },
    "render": {
        "description": "Lancer un rendu de la scène",
        "parameters": {
            "resolution_x": {"type": "integer", "default": 1920},
            "resolution_y": {"type": "integer", "default": 1080},
            "samples": {"type": "integer", "default": 128},
            "engine": {"type": "string", "enum": ["cycles", "eevee"], "default": "eevee"},
            "output_format": {"type": "string", "enum": ["PNG", "JPEG"], "default": "PNG"},
        },
        "permission": "export",
    },
    "export": {
        "description": "Exporter la scène dans un format donné",
        "parameters": {
            "format": {"type": "string", "enum": ["blend", "glb", "fbx", "obj"]},
            "filename": {"type": "string", "description": "Nom du fichier (sans extension)"},
            "selected_only": {"type": "boolean", "default": False},
        },
        "permission": "export",
    },
    "execute_script": {
        "description": "Exécuter un script Blender Python personnalisé",
        "parameters": {
            "script": {"type": "string", "description": "Code Python Blender"},
            "description": {"type": "string", "description": "Description de ce que fait le script"},
        },
        "permission": "execute_script",
    },
}

DEFAULT_PERMISSIONS = {
    "open_blender": True,
    "import_image": True,
    "create_mesh": True,
    "export": True,
    "execute_script": False,  # Disabled by default for security
}


# ── Device Management ────────────────────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def register_device(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    assistant_id: uuid.UUID,
    device_name: str,
    device_os: str = "windows",
    blender_version: Optional[str] = None,
    blender_path: Optional[str] = None,
    connection_method: str = "websocket",
) -> tuple[BridgeDevice, str]:
    """Register a new desktop bridge device. Returns (device, raw_token)."""
    raw_token = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_token)

    device = BridgeDevice(
        workspace_id=workspace_id,
        user_id=user_id,
        assistant_id=assistant_id,
        device_name=device_name,
        device_os=device_os,
        blender_version=blender_version,
        blender_path=blender_path,
        device_token_hash=token_hash,
        status=BridgeDeviceStatus.PENDING,
        permissions=DEFAULT_PERMISSIONS.copy(),
        connection_method=connection_method,
    )
    db.add(device)
    await db.flush()
    return device, raw_token


async def authenticate_device(db: AsyncSession, device_id: str, token: str) -> Optional[BridgeDevice]:
    """Authenticate a device by ID and token."""
    result = await db.execute(
        select(BridgeDevice).where(
            BridgeDevice.id == uuid.UUID(device_id),
            BridgeDevice.status != BridgeDeviceStatus.REVOKED,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        return None

    if device.device_token_hash != _hash_token(token):
        return None

    return device


async def update_device_status(
    db: AsyncSession, device_id: uuid.UUID, status: BridgeDeviceStatus
) -> None:
    """Update device connection status."""
    await db.execute(
        update(BridgeDevice)
        .where(BridgeDevice.id == device_id)
        .values(
            status=status,
            last_heartbeat=datetime.now(timezone.utc).isoformat() if status == BridgeDeviceStatus.CONNECTED else None,
        )
    )
    await db.flush()


async def revoke_device(db: AsyncSession, device_id: uuid.UUID) -> None:
    """Revoke a device - permanently disconnect."""
    await db.execute(
        update(BridgeDevice)
        .where(BridgeDevice.id == device_id)
        .values(status=BridgeDeviceStatus.REVOKED)
    )
    # Remove from active connections
    _active_connections.pop(str(device_id), None)
    await db.flush()


async def list_devices(
    db: AsyncSession, workspace_id: uuid.UUID, assistant_id: Optional[uuid.UUID] = None
) -> list[BridgeDevice]:
    """List bridge devices for a workspace."""
    query = select(BridgeDevice).where(
        BridgeDevice.workspace_id == workspace_id,
        BridgeDevice.status != BridgeDeviceStatus.REVOKED,
    )
    if assistant_id:
        query = query.where(BridgeDevice.assistant_id == assistant_id)
    result = await db.execute(query.order_by(BridgeDevice.created_at.desc()))
    return list(result.scalars().all())


async def update_device_permissions(
    db: AsyncSession, device_id: uuid.UUID, permissions: dict
) -> None:
    """Update device permissions."""
    await db.execute(
        update(BridgeDevice)
        .where(BridgeDevice.id == device_id)
        .values(permissions=permissions)
    )
    await db.flush()


# ── Action Management ────────────────────────────────────────────────

async def create_bridge_action(
    db: AsyncSession,
    device_id: uuid.UUID,
    assistant_id: uuid.UUID,
    action_type: str,
    parameters: Optional[dict] = None,
    conversation_id: Optional[uuid.UUID] = None,
    requires_approval: bool = True,
) -> BridgeAction:
    """Create a new bridge action (command to send to desktop)."""
    if action_type not in BLENDER_COMMANDS:
        raise ValueError(f"Unknown action type: {action_type}")

    action = BridgeAction(
        device_id=device_id,
        assistant_id=assistant_id,
        conversation_id=conversation_id,
        action_type=action_type,
        parameters=parameters,
        requires_approval=requires_approval,
    )
    db.add(action)
    await db.flush()
    return action


async def approve_action(
    db: AsyncSession, action_id: uuid.UUID, approved: bool
) -> Optional[BridgeAction]:
    """Approve or reject a pending action."""
    result = await db.execute(
        select(BridgeAction).where(
            BridgeAction.id == action_id,
            BridgeAction.status == BridgeActionStatus.PENDING,
        )
    )
    action = result.scalar_one_or_none()
    if not action:
        return None

    action.approved_by_user = approved
    if approved:
        action.status = BridgeActionStatus.SENT
    else:
        action.status = BridgeActionStatus.CANCELLED
    await db.flush()
    return action


async def complete_action(
    db: AsyncSession,
    action_id: uuid.UUID,
    status: str,
    result_data: Optional[dict] = None,
    error_message: Optional[str] = None,
) -> Optional[BridgeAction]:
    """Mark an action as completed or failed (called by desktop bridge)."""
    result = await db.execute(
        select(BridgeAction).where(BridgeAction.id == action_id)
    )
    action = result.scalar_one_or_none()
    if not action:
        return None

    action.status = BridgeActionStatus.COMPLETED if status == "completed" else BridgeActionStatus.FAILED
    action.result = result_data
    action.error_message = error_message
    await db.flush()
    return action


async def list_actions(
    db: AsyncSession,
    device_id: Optional[uuid.UUID] = None,
    assistant_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = 50,
) -> list[BridgeAction]:
    """List bridge actions with optional filters."""
    query = select(BridgeAction)
    if device_id:
        query = query.where(BridgeAction.device_id == device_id)
    if assistant_id:
        query = query.where(BridgeAction.assistant_id == assistant_id)
    if status:
        query = query.where(BridgeAction.status == status)
    result = await db.execute(query.order_by(BridgeAction.created_at.desc()).limit(limit))
    return list(result.scalars().all())


def get_available_commands() -> dict:
    """Return the command registry for the API."""
    return BLENDER_COMMANDS


def check_permission(device: BridgeDevice, action_type: str) -> bool:
    """Check if a device has permission to execute an action type."""
    command = BLENDER_COMMANDS.get(action_type)
    if not command:
        return False
    required_permission = command.get("permission", "create_mesh")
    return bool(device.permissions and device.permissions.get(required_permission, False))


# ── WebSocket Connection Management ─────────────────────────────────

def register_ws_connection(device_id: str, websocket) -> None:
    """Register an active WebSocket connection."""
    _active_connections[device_id] = websocket


def unregister_ws_connection(device_id: str) -> None:
    """Remove a WebSocket connection."""
    _active_connections.pop(device_id, None)


def get_ws_connection(device_id: str):
    """Get an active WebSocket connection for a device."""
    return _active_connections.get(device_id)


def is_device_online(device_id: str) -> bool:
    """Check if a device has an active WebSocket connection."""
    return device_id in _active_connections
