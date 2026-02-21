"""Actions service - tool execution with permissions and audit logging.

Each action (tool) has:
- A unique name
- Required permissions
- An execution function
- Rate limiting
- Full audit trail
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


# Action registry
AVAILABLE_ACTIONS = {
    "send_email": {
        "name": "send_email",
        "description": "Envoyer un email",
        "category": "communication",
        "permissions": ["email.send"],
        "rate_limit": 10,  # per hour
    },
    "read_calendar": {
        "name": "read_calendar",
        "description": "Lire les événements du calendrier",
        "category": "productivity",
        "permissions": ["calendar.read"],
        "rate_limit": 30,
    },
    "create_calendar_event": {
        "name": "create_calendar_event",
        "description": "Créer un événement dans le calendrier",
        "category": "productivity",
        "permissions": ["calendar.write"],
        "rate_limit": 10,
    },
    "search_documents": {
        "name": "search_documents",
        "description": "Rechercher dans les documents",
        "category": "documents",
        "permissions": ["docs.read"],
        "rate_limit": 30,
    },
    "create_document": {
        "name": "create_document",
        "description": "Créer un document",
        "category": "documents",
        "permissions": ["docs.write"],
        "rate_limit": 10,
    },
    "crm_lookup": {
        "name": "crm_lookup",
        "description": "Recherche CRM (contacts, entreprises)",
        "category": "crm",
        "permissions": ["crm.read"],
        "rate_limit": 30,
    },
    "crm_update": {
        "name": "crm_update",
        "description": "Mettre à jour le CRM",
        "category": "crm",
        "permissions": ["crm.write"],
        "rate_limit": 10,
    },
    "google_sheets_read": {
        "name": "google_sheets_read",
        "description": "Lire un Google Sheet",
        "category": "google",
        "permissions": ["sheets.read"],
        "rate_limit": 20,
    },
    "google_sheets_write": {
        "name": "google_sheets_write",
        "description": "Écrire dans un Google Sheet",
        "category": "google",
        "permissions": ["sheets.write"],
        "rate_limit": 10,
    },
    "google_drive_search": {
        "name": "google_drive_search",
        "description": "Rechercher dans Google Drive",
        "category": "google",
        "permissions": ["drive.read"],
        "rate_limit": 20,
    },
    "web_search": {
        "name": "web_search",
        "description": "Recherche web",
        "category": "web",
        "permissions": ["web.search"],
        "rate_limit": 20,
    },
}


def get_available_actions() -> list[dict]:
    return list(AVAILABLE_ACTIONS.values())


def validate_action(action_name: str, enabled_actions: dict) -> bool:
    """Check if an action is enabled for the assistant (principle of least privilege)."""
    if action_name not in AVAILABLE_ACTIONS:
        return False
    return enabled_actions.get(action_name, False)


async def log_action_execution(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
    action_name: str,
    resource_type: str,
    resource_id: Optional[str],
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    """Log every action execution in immutable audit trail."""
    log = AuditLog(
        workspace_id=workspace_id,
        user_id=user_id,
        action=f"action.{action_name}",
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log)
    await db.flush()


async def execute_action(
    action_name: str,
    params: dict,
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> dict:
    """Execute an action with full audit logging.

    In production, each action would integrate with real APIs.
    This provides the framework + stub implementations.
    """
    if action_name not in AVAILABLE_ACTIONS:
        raise ValueError(f"Unknown action: {action_name}")

    # Log execution
    await log_action_execution(
        db=db,
        workspace_id=workspace_id,
        user_id=user_id,
        action_name=action_name,
        resource_type="action",
        resource_id=action_name,
        details={"params": params, "timestamp": datetime.now(timezone.utc).isoformat()},
    )

    # Stub implementations - replace with real integrations
    handlers = {
        "send_email": _stub_send_email,
        "read_calendar": _stub_read_calendar,
        "create_calendar_event": _stub_create_event,
        "search_documents": _stub_search_docs,
        "web_search": _stub_web_search,
    }

    handler = handlers.get(action_name, _stub_generic)
    return await handler(params)


async def _stub_send_email(params: dict) -> dict:
    return {"status": "sent", "to": params.get("to", ""), "subject": params.get("subject", "")}


async def _stub_read_calendar(params: dict) -> dict:
    return {"events": [], "message": "Calendar integration ready - configure OAuth credentials"}


async def _stub_create_event(params: dict) -> dict:
    return {"status": "created", "event_id": str(uuid.uuid4())}


async def _stub_search_docs(params: dict) -> dict:
    return {"results": [], "message": "Document search ready - configure storage integration"}


async def _stub_web_search(params: dict) -> dict:
    return {"results": [], "query": params.get("query", "")}


async def _stub_generic(params: dict) -> dict:
    return {"status": "ok", "message": "Action stub - integration pending"}
