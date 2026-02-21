"""Tests for LiveKit token generation."""

import pytest
import jwt

from app.services.livekit_service import generate_livekit_token, generate_agent_token
from app.core.config import get_settings

settings = get_settings()


def test_generate_livekit_token():
    """Test LiveKit JWT token generation."""
    token = generate_livekit_token(
        room_name="test-room",
        participant_name="Test User",
        participant_identity="user-123",
    )

    assert token is not None
    assert isinstance(token, str)

    # Decode and verify claims
    decoded = jwt.decode(token, settings.LIVEKIT_API_SECRET, algorithms=["HS256"])
    assert decoded["iss"] == settings.LIVEKIT_API_KEY
    assert decoded["sub"] == "user-123"
    assert decoded["name"] == "Test User"
    assert decoded["video"]["room"] == "test-room"
    assert decoded["video"]["roomJoin"] is True
    assert decoded["video"]["canPublish"] is True
    assert decoded["video"]["canSubscribe"] is True


def test_generate_agent_token():
    """Test agent token for AI participant."""
    token = generate_agent_token("test-room", "agent-abc")

    decoded = jwt.decode(token, settings.LIVEKIT_API_SECRET, algorithms=["HS256"])
    assert decoded["sub"] == "agent-abc"
    assert decoded["name"] == "EMEFA Assistant"
    assert decoded["video"]["room"] == "test-room"
    assert decoded["video"]["canPublish"] is True


def test_token_permissions():
    """Test tokens with restricted permissions."""
    token = generate_livekit_token(
        room_name="restricted-room",
        participant_name="Viewer",
        participant_identity="viewer-1",
        can_publish=False,
        can_subscribe=True,
    )

    decoded = jwt.decode(token, settings.LIVEKIT_API_SECRET, algorithms=["HS256"])
    assert decoded["video"]["canPublish"] is False
    assert decoded["video"]["canSubscribe"] is True
