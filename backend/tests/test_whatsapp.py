"""Tests for WhatsApp service."""

import pytest
from unittest.mock import patch
from app.services.whatsapp_service import verify_whatsapp_webhook


@pytest.mark.asyncio
async def test_whatsapp_webhook_verify_success():
    """Test successful webhook verification."""
    with patch("app.services.whatsapp_service.settings") as mock_settings:
        mock_settings.WHATSAPP_VERIFY_TOKEN = "test_token"
        result = await verify_whatsapp_webhook("subscribe", "test_token", "challenge_123")
        assert result == "challenge_123"


@pytest.mark.asyncio
async def test_whatsapp_webhook_verify_failure():
    """Test failed webhook verification (wrong token)."""
    with patch("app.services.whatsapp_service.settings") as mock_settings:
        mock_settings.WHATSAPP_VERIFY_TOKEN = "test_token"
        result = await verify_whatsapp_webhook("subscribe", "wrong_token", "challenge_123")
        assert result is None


@pytest.mark.asyncio
async def test_whatsapp_webhook_verify_wrong_mode():
    """Test failed webhook verification (wrong mode)."""
    with patch("app.services.whatsapp_service.settings") as mock_settings:
        mock_settings.WHATSAPP_VERIFY_TOKEN = "test_token"
        result = await verify_whatsapp_webhook("unsubscribe", "test_token", "challenge_123")
        assert result is None
