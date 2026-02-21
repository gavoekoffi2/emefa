"""IronClaw HTTP client - communicates with the IronClaw agent runtime.

IronClaw is a Rust-based secure AI agent runtime that handles:
- Agent loop (LLM reasoning + tool execution)
- WASM-sandboxed tool execution
- Prompt injection defense
- Memory management with vector search

This client wraps IronClaw's HTTP/webhook API for use by EMEFA's backend.
"""

import json
from typing import AsyncIterator, Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class IronClawClient:
    """HTTP client for the IronClaw agent runtime."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.IRONCLAW_URL

    async def send_message(
        self,
        message: str,
        session_id: str,
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        context: Optional[list[dict]] = None,
    ) -> dict:
        """Send a message to IronClaw and get a response.

        Args:
            message: User message text
            session_id: Unique session ID for conversation tracking
            system_prompt: Optional system prompt override
            tools: Optional list of tool definitions
            context: Optional conversation context (previous messages)

        Returns:
            dict with 'content', 'tool_calls', 'tokens_used'
        """
        payload = {
            "message": message,
            "session_id": session_id,
        }
        if system_prompt:
            payload["system_prompt"] = system_prompt
        if tools:
            payload["tools"] = tools
        if context:
            payload["context"] = context

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.ConnectError:
                # IronClaw not available, fall back to direct LLM
                return await self._fallback_chat(message, system_prompt, context)
            except Exception as e:
                return await self._fallback_chat(message, system_prompt, context)

    async def stream_message(
        self,
        message: str,
        session_id: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream a response from IronClaw via SSE."""
        payload = {
            "message": message,
            "session_id": session_id,
            "stream": True,
        }
        if system_prompt:
            payload["system_prompt"] = system_prompt

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat/stream",
                json=payload,
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        yield data

    async def create_session(self, session_id: str, config: dict) -> dict:
        """Create a new IronClaw session with specific configuration."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/api/sessions",
                    json={"session_id": session_id, **config},
                )
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {"status": "fallback", "session_id": session_id}

    async def register_tools(self, session_id: str, tools: list[dict]) -> dict:
        """Register tools for a session."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/api/sessions/{session_id}/tools",
                    json={"tools": tools},
                )
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {"status": "fallback"}

    async def health_check(self) -> bool:
        """Check if IronClaw is running and healthy."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
            except Exception:
                return False

    async def _fallback_chat(
        self,
        message: str,
        system_prompt: Optional[str],
        context: Optional[list[dict]],
    ) -> dict:
        """Fallback to direct LLM call when IronClaw is unavailable."""
        from app.services.llm_service import get_llm_provider

        llm = get_llm_provider()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": message})

        result = await llm.chat(messages)
        return {
            "content": result["content"],
            "tool_calls": [],
            "tokens_used": result["tokens"],
            "fallback": True,
        }


# Singleton
_client: Optional[IronClawClient] = None


def get_ironclaw_client() -> IronClawClient:
    global _client
    if _client is None:
        _client = IronClawClient()
    return _client
