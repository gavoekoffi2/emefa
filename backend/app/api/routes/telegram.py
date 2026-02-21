"""Telegram webhook routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.assistant import Assistant
from app.models.conversation import ChannelType
from app.services.chat_service import chat_with_assistant
from app.services.telegram_service import send_telegram_message

router = APIRouter(prefix="/webhooks/telegram", tags=["telegram"])


@router.post("/{assistant_id}")
async def telegram_webhook(
    assistant_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle incoming Telegram messages."""
    body = await request.json()

    message = body.get("message")
    if not message:
        return {"ok": True}

    chat_id = str(message["chat"]["id"])
    text = message.get("text", "")

    if not text or text.startswith("/start"):
        return {"ok": True}

    # Find assistant
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.telegram_enabled == True,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        return {"ok": True}

    try:
        response = await chat_with_assistant(
            db=db,
            assistant=assistant,
            user_message=text,
            channel=ChannelType.TELEGRAM,
            external_chat_id=chat_id,
        )
        await db.commit()

        # Send reply via Telegram
        bot_token = assistant.telegram_bot_token
        if bot_token:
            await send_telegram_message(bot_token, chat_id, response["message"])
    except Exception as e:
        # Log error but don't fail webhook
        import logging
        logging.getLogger(__name__).error(f"Telegram webhook error: {e}")

    return {"ok": True}
