"""Bridge routes - device management, actions, WebSocket for desktop bridge."""

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


def _parse_uuid(value: str, name: str = "ID") -> uuid.UUID:
    """Parse a string to UUID, raising HTTP 400 on invalid format."""
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail=f"Invalid {name} format")

from app.core.database import get_db, async_session
from app.core.deps import get_current_user, get_current_workspace
from app.models.template import BridgeDevice, BridgeDeviceStatus
from app.models.user import User, Workspace
from app.schemas.template import (
    BridgeActionApproval,
    BridgeActionRequest,
    BridgeActionResponse,
    BridgeActionResult,
    BridgeDeviceRegister,
    BridgeDeviceResponse,
    BridgeDeviceToken,
    BridgePermissionUpdate,
)
from app.services.audit_service import log_action
from app.services import bridge_service

router = APIRouter(prefix="/bridge", tags=["bridge"])


def _device_response(d: BridgeDevice) -> BridgeDeviceResponse:
    return BridgeDeviceResponse(
        id=str(d.id),
        assistant_id=str(d.assistant_id),
        device_name=d.device_name,
        device_os=d.device_os,
        bridge_version=d.bridge_version,
        blender_version=d.blender_version,
        status=d.status.value if hasattr(d.status, 'value') else d.status,
        permissions=d.permissions,
        last_heartbeat=d.last_heartbeat,
        connection_method=d.connection_method,
        created_at=str(d.created_at) if d.created_at else "",
    )


def _action_response(a) -> BridgeActionResponse:
    return BridgeActionResponse(
        id=str(a.id),
        device_id=str(a.device_id),
        action_type=a.action_type,
        parameters=a.parameters,
        status=a.status.value if hasattr(a.status, 'value') else a.status,
        result=a.result,
        error_message=a.error_message,
        requires_approval=a.requires_approval,
        approved_by_user=a.approved_by_user,
        created_at=str(a.created_at) if a.created_at else "",
    )


# ── Device Management ────────────────────────────────────────────────

@router.post("/devices", response_model=BridgeDeviceToken, status_code=201)
async def register_device(
    req: BridgeDeviceRegister,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a new desktop bridge device."""
    device, raw_token = await bridge_service.register_device(
        db,
        workspace_id=workspace.id,
        user_id=user.id,
        assistant_id=_parse_uuid(req.assistant_id, "assistant_id"),
        device_name=req.device_name,
        device_os=req.device_os,
        blender_version=req.blender_version,
        blender_path=req.blender_path,
        connection_method=req.connection_method,
    )

    await log_action(
        db, workspace.id, "create", "bridge_device",
        resource_id=str(device.id), user_id=user.id,
        details={"device_name": device.device_name, "os": device.device_os},
    )
    await db.commit()

    return BridgeDeviceToken(
        device_id=str(device.id),
        device_token=raw_token,
        websocket_url=f"/api/v1/bridge/ws/{device.id}",
    )


@router.get("/devices", response_model=list[BridgeDeviceResponse])
async def list_devices(
    assistant_id: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List bridge devices for the workspace."""
    aid = _parse_uuid(assistant_id, "assistant_id") if assistant_id else None
    devices = await bridge_service.list_devices(db, workspace.id, assistant_id=aid)
    return [_device_response(d) for d in devices]


@router.get("/devices/{device_id}", response_model=BridgeDeviceResponse)
async def get_device(
    device_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific device."""
    result = await db.execute(
        select(BridgeDevice).where(
            BridgeDevice.id == _parse_uuid(device_id, "device_id"),
            BridgeDevice.workspace_id == workspace.id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _device_response(device)


@router.patch("/devices/{device_id}/permissions")
async def update_permissions(
    device_id: str,
    req: BridgePermissionUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update device permissions."""
    result = await db.execute(
        select(BridgeDevice).where(
            BridgeDevice.id == _parse_uuid(device_id, "device_id"),
            BridgeDevice.workspace_id == workspace.id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    await bridge_service.update_device_permissions(db, device.id, req.permissions)
    await log_action(
        db, workspace.id, "update", "bridge_device",
        resource_id=device_id, user_id=user.id,
        details={"permissions": req.permissions},
    )
    await db.commit()
    return {"status": "ok"}


@router.delete("/devices/{device_id}", status_code=204)
async def revoke_device(
    device_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a device - permanently disconnect."""
    result = await db.execute(
        select(BridgeDevice).where(
            BridgeDevice.id == _parse_uuid(device_id, "device_id"),
            BridgeDevice.workspace_id == workspace.id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    await bridge_service.revoke_device(db, device.id)
    await log_action(
        db, workspace.id, "delete", "bridge_device",
        resource_id=device_id, user_id=user.id,
        details={"device_name": device.device_name},
    )
    await db.commit()


@router.get("/devices/{device_id}/status")
async def device_status(device_id: str):
    """Check if a device is online (WebSocket connected)."""
    online = bridge_service.is_device_online(device_id)
    return {"device_id": device_id, "online": online}


# ── Commands ─────────────────────────────────────────────────────────

@router.get("/commands")
async def list_commands():
    """List all available Blender bridge commands."""
    return bridge_service.get_available_commands()


# ── Actions ──────────────────────────────────────────────────────────

@router.post("/actions", response_model=BridgeActionResponse, status_code=201)
async def create_action(
    req: BridgeActionRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a bridge action (command to send to desktop Blender)."""
    # Verify device belongs to workspace
    result = await db.execute(
        select(BridgeDevice).where(
            BridgeDevice.id == _parse_uuid(req.device_id, "device_id"),
            BridgeDevice.workspace_id == workspace.id,
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if device.status == BridgeDeviceStatus.REVOKED:
        raise HTTPException(status_code=400, detail="Device has been revoked")

    # Check permission
    if not bridge_service.check_permission(device, req.action_type):
        raise HTTPException(
            status_code=403,
            detail=f"Device does not have permission for action: {req.action_type}",
        )

    action = await bridge_service.create_bridge_action(
        db,
        device_id=device.id,
        assistant_id=device.assistant_id,
        action_type=req.action_type,
        parameters=req.parameters,
        requires_approval=req.requires_approval,
    )

    await log_action(
        db, workspace.id, "create", "bridge_action",
        resource_id=str(action.id), user_id=user.id,
        details={"action_type": req.action_type, "device": device.device_name},
    )
    await db.commit()

    # If no approval required and device is online, send immediately via WebSocket
    if not req.requires_approval:
        ws = bridge_service.get_ws_connection(str(device.id))
        if ws:
            try:
                await ws.send_json({
                    "type": "execute_action",
                    "action_id": str(action.id),
                    "action_type": req.action_type,
                    "parameters": req.parameters,
                })
            except Exception:
                pass

    return _action_response(action)


@router.post("/actions/{action_id}/approve")
async def approve_action(
    action_id: str,
    req: BridgeActionApproval,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a pending bridge action."""
    action = await bridge_service.approve_action(db, _parse_uuid(action_id, "action_id"), req.approved)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found or not pending")

    await log_action(
        db, workspace.id, "update", "bridge_action",
        resource_id=action_id, user_id=user.id,
        details={"approved": req.approved},
    )
    await db.commit()

    # If approved, send to device via WebSocket
    if req.approved:
        ws = bridge_service.get_ws_connection(str(action.device_id))
        if ws:
            try:
                await ws.send_json({
                    "type": "execute_action",
                    "action_id": str(action.id),
                    "action_type": action.action_type,
                    "parameters": action.parameters,
                })
            except Exception:
                pass

    return _action_response(action)


@router.get("/actions", response_model=list[BridgeActionResponse])
async def list_actions(
    device_id: str = None,
    assistant_id: str = None,
    status: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List bridge actions."""
    did = _parse_uuid(device_id, "device_id") if device_id else None
    aid = _parse_uuid(assistant_id, "assistant_id") if assistant_id else None
    actions = await bridge_service.list_actions(db, device_id=did, assistant_id=aid, status=status)
    return [_action_response(a) for a in actions]


# ── WebSocket for Desktop Bridge ─────────────────────────────────────

@router.websocket("/ws/{device_id}")
async def bridge_websocket(websocket: WebSocket, device_id: str):
    """WebSocket endpoint for desktop bridge connections.

    Protocol:
    1. Client connects with ?token=<device_token>
    2. Server authenticates and registers connection
    3. Bidirectional messages:
       - Server -> Client: execute_action, ping
       - Client -> Server: action_result, heartbeat, capability_update
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    # Authenticate device
    async with async_session() as db:
        device = await bridge_service.authenticate_device(db, device_id, token)
        if not device:
            await websocket.close(code=4003, reason="Invalid credentials")
            return

        await websocket.accept()
        await bridge_service.update_device_status(db, device.id, BridgeDeviceStatus.CONNECTED)
        await db.commit()

    bridge_service.register_ws_connection(device_id, websocket)

    try:
        # Send welcome message with capabilities
        await websocket.send_json({
            "type": "connected",
            "device_id": device_id,
            "permissions": device.permissions,
            "commands": list(bridge_service.get_available_commands().keys()),
        })

        # Send any pending approved actions
        async with async_session() as db:
            pending = await bridge_service.list_actions(
                db, device_id=device.id, status="sent"
            )
            for action in pending:
                await websocket.send_json({
                    "type": "execute_action",
                    "action_id": str(action.id),
                    "action_type": action.action_type,
                    "parameters": action.parameters,
                })

        # Main message loop
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "heartbeat":
                async with async_session() as db:
                    await bridge_service.update_device_status(
                        db, uuid.UUID(device_id), BridgeDeviceStatus.CONNECTED
                    )
                    await db.commit()
                await websocket.send_json({"type": "pong"})

            elif msg_type == "action_result":
                action_id = data.get("action_id")
                if action_id:
                    async with async_session() as db:
                        await bridge_service.complete_action(
                            db,
                            uuid.UUID(action_id),
                            status=data.get("status", "completed"),
                            result_data=data.get("result"),
                            error_message=data.get("error"),
                        )
                        await db.commit()

            elif msg_type == "capability_update":
                async with async_session() as db:
                    result = await db.execute(
                        select(BridgeDevice).where(BridgeDevice.id == uuid.UUID(device_id))
                    )
                    dev = result.scalar_one_or_none()
                    if dev:
                        if data.get("blender_version"):
                            dev.blender_version = data["blender_version"]
                        if data.get("blender_path"):
                            dev.blender_path = data["blender_path"]
                        await db.commit()

    except WebSocketDisconnect:
        logger.info(f"Bridge device {device_id} disconnected")
    except Exception as e:
        logger.error(f"Bridge WebSocket error for device {device_id}: {e}")
    finally:
        bridge_service.unregister_ws_connection(device_id)
        async with async_session() as db:
            await bridge_service.update_device_status(
                db, uuid.UUID(device_id), BridgeDeviceStatus.DISCONNECTED
            )
            await db.commit()
