"""WhatsApp service - Cloud API (official) + QR bridge (unofficial)."""

from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()

# ============================
# WhatsApp Cloud API (Official)
# ============================

WHATSAPP_API_BASE = "https://graph.facebook.com/v18.0"


async def send_whatsapp_message(phone_number_id: str, to: str, text: str):
    """Send a text message via WhatsApp Cloud API."""
    url = f"{WHATSAPP_API_BASE}/{phone_number_id}/messages"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": text},
            },
        )
        resp.raise_for_status()
        return resp.json()


async def verify_whatsapp_webhook(mode: str, token: str, challenge: str) -> Optional[str]:
    """Verify WhatsApp webhook subscription."""
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None


# ============================
# WhatsApp QR Bridge (Unofficial - Baileys)
# ============================
# This is isolated in a separate Node.js microservice
# See: infra/whatsapp-qr-service/


async def get_qr_code(session_id: str) -> Optional[str]:
    """Get QR code from the Baileys bridge service."""
    if not settings.WHATSAPP_QR_ENABLED:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.WHATSAPP_QR_SERVICE_URL}/session/{session_id}/qr"
            )
            if resp.status_code == 200:
                return resp.json().get("qr")
    except Exception:
        pass
    return None


async def send_qr_message(session_id: str, to: str, text: str) -> bool:
    """Send message via Baileys bridge."""
    if not settings.WHATSAPP_QR_ENABLED:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.WHATSAPP_QR_SERVICE_URL}/session/{session_id}/send",
                json={"to": to, "text": text},
            )
            return resp.status_code == 200
    except Exception:
        return False
