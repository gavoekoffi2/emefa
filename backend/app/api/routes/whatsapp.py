"""WhatsApp routes - Cloud API webhook + QR bridge."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.assistant import Assistant
from app.models.conversation import ChannelType
from app.models.user import User, Workspace
from app.services.chat_service import chat_with_assistant
from app.services.whatsapp_service import (
    get_qr_code,
    send_whatsapp_message,
    verify_whatsapp_webhook,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])


# =====================
# Cloud API Webhook
# =====================

@router.get("")
async def whatsapp_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """WhatsApp Cloud API webhook verification."""
    if hub_mode and hub_verify_token and hub_challenge:
        result = await verify_whatsapp_webhook(hub_mode, hub_verify_token, hub_challenge)
        if result:
            return int(result)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle incoming WhatsApp Cloud API messages."""
    try:
        body = await request.json()
    except Exception:
        return {"status": "ok"}

    entries = body.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                if msg.get("type") != "text":
                    continue

                from_number = msg.get("from")
                text_body = msg.get("text", {})
                text = text_body.get("body", "") if isinstance(text_body, dict) else ""
                phone_id = value.get("metadata", {}).get("phone_number_id")

                if not phone_id or not from_number or not text:
                    continue

                # Truncate excessively long messages
                if len(text) > 4000:
                    text = text[:4000]

                # Find assistant by whatsapp_phone_id
                result = await db.execute(
                    select(Assistant).where(
                        Assistant.whatsapp_phone_id == phone_id,
                        Assistant.whatsapp_enabled == True,
                    )
                )
                assistant = result.scalar_one_or_none()
                if not assistant:
                    continue

                try:
                    response = await chat_with_assistant(
                        db=db,
                        assistant=assistant,
                        user_message=text,
                        channel=ChannelType.WHATSAPP,
                        external_chat_id=from_number,
                    )
                    await db.commit()
                    await send_whatsapp_message(phone_id, from_number, response["message"])
                except Exception as e:
                    logger.error(f"WhatsApp webhook error: {e}")

    return {"status": "ok"}


# =====================
# QR Bridge endpoints
# =====================

qr_router = APIRouter(prefix="/whatsapp-qr", tags=["whatsapp-qr"])


class QRResponse(BaseModel):
    qr: str | None
    enabled: bool


@qr_router.get("/{assistant_id}/qr", response_model=QRResponse)
async def get_whatsapp_qr(
    assistant_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get QR code for WhatsApp Web connection (unofficial)."""
    from app.core.config import get_settings
    settings = get_settings()

    if not settings.WHATSAPP_QR_ENABLED:
        return QRResponse(qr=None, enabled=False)

    try:
        parsed_id = uuid.UUID(assistant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assistant ID format")

    result = await db.execute(
        select(Assistant).where(
            Assistant.id == parsed_id,
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    session_id = f"emefa-{assistant.id.hex[:12]}"
    qr = await get_qr_code(session_id)
    return QRResponse(qr=qr, enabled=True)
