"""IronClaw HTTP client - communicates with the IronClaw agent runtime.

IronClaw is a Rust-based secure AI agent runtime that handles:
- Agent loop (LLM reasoning + tool execution)
- WASM-sandboxed tool execution with capability-based permissions
- Prompt injection defense + content sanitization
- Hybrid memory (full-text + vector via Reciprocal Rank Fusion)

IronClaw exposes:
- OpenAI-compatible endpoint: /v1/chat/completions (port 3000)
- Web Gateway: /api/chat/send, /api/chat/events (SSE), /api/chat/ws (WebSocket)
- Memory API: /api/memory/*
- Health: /health

This client wraps these APIs for use by EMEFA's backend.
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
        """Send a message via the OpenAI-compatible chat completions endpoint.

        IronClaw exposes /v1/chat/completions with full OpenAI compatibility,
        including tool/function calling, streaming, and token limits.

        Args:
            message: User message text
            session_id: Unique session ID for conversation tracking
            system_prompt: Optional system prompt override
            tools: Optional list of tool definitions (OpenAI format)
            context: Optional conversation context (previous messages)

        Returns:
            dict with 'content', 'tool_calls', 'tokens_used'
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": message})

        payload = {
            "model": "default",
            "messages": messages,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json=payload,
                    headers={"X-Session-ID": session_id},
                )
                resp.raise_for_status()
                data = resp.json()
                choice = data["choices"][0]["message"]
                usage = data.get("usage", {})
                return {
                    "content": choice.get("content", ""),
                    "tool_calls": choice.get("tool_calls", []),
                    "tokens_used": usage.get("total_tokens", 0),
                }
            except httpx.ConnectError:
                return await self._fallback_chat(message, system_prompt, context)
            except Exception:
                return await self._fallback_chat(message, system_prompt, context)

    async def stream_message(
        self,
        message: str,
        session_id: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream a response via the OpenAI-compatible streaming endpoint.

        Uses /v1/chat/completions with stream=true (SSE format).
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})

        payload = {
            "model": "default",
            "messages": messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers={"X-Session-ID": session_id},
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    async def send_via_gateway(self, message: str) -> dict:
        """Send a message via the Web Gateway API (/api/chat/send).

        This is the native IronClaw API (not OpenAI-compatible) which provides
        richer features like job tracking and memory access.
        """
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/api/chat/send",
                    json={"message": message},
                )
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {"error": "Gateway unavailable"}

    async def search_memory(self, query: str, limit: int = 5) -> list[dict]:
        """Search IronClaw's hybrid memory (full-text + vector via RRF)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/api/memory/search",
                    params={"q": query, "limit": limit},
                )
                resp.raise_for_status()
                return resp.json().get("results", [])
            except Exception:
                return []

    async def health_check(self) -> bool:
        """Check if IronClaw is running and healthy."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
            except Exception:
                return False

    async def list_models(self) -> list[dict]:
        """List available models via OpenAI-compatible /v1/models."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/v1/models")
                resp.raise_for_status()
                return resp.json().get("data", [])
            except Exception:
                return []

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
