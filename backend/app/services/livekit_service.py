"""LiveKit service - token generation and room management."""

import time
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


def generate_livekit_token(
    room_name: str,
    participant_name: str,
    participant_identity: str,
    can_publish: bool = True,
    can_subscribe: bool = True,
    ttl: int = 3600,
) -> str:
    """Generate a LiveKit access token using JWT.

    LiveKit tokens are JWTs with specific claims for room access.
    """
    import jwt

    now = int(time.time())
    claims = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": participant_identity,
        "nbf": now,
        "exp": now + ttl,
        "name": participant_name,
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": can_publish,
            "canSubscribe": can_subscribe,
            "canPublishData": True,
        },
        "metadata": "",
    }

    return jwt.encode(claims, settings.LIVEKIT_API_SECRET, algorithm="HS256")


def generate_agent_token(room_name: str, agent_identity: str) -> str:
    """Generate a token for the AI agent to join the LiveKit room."""
    return generate_livekit_token(
        room_name=room_name,
        participant_name="EMEFA Assistant",
        participant_identity=agent_identity,
        can_publish=True,
        can_subscribe=True,
    )
