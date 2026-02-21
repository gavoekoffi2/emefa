"""Telegram bot service - webhook handling."""

import uuid
from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


async def send_telegram_message(bot_token: str, chat_id: str, text: str):
    """Send a message via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
        })
        resp.raise_for_status()
        return resp.json()


async def set_webhook(bot_token: str, webhook_url: str):
    """Set Telegram webhook URL."""
    url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json={"url": webhook_url})
        resp.raise_for_status()
        return resp.json()


async def delete_webhook(bot_token: str):
    """Remove Telegram webhook."""
    url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url)
        resp.raise_for_status()
