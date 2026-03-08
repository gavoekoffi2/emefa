"""LLM Provider abstraction - plug-and-play with Ollama, OpenRouter, OpenAI."""

import json
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class LLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list[dict], model: Optional[str] = None, **kwargs) -> dict:
        """Send chat completion request, return {"content": str, "tokens": int}."""

    @abstractmethod
    async def embed(self, texts: list[str], model: Optional[str] = None) -> list[list[float]]:
        """Generate embeddings for texts."""


class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.default_model = settings.OLLAMA_MODEL
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    async def chat(self, messages: list[dict], model: Optional[str] = None, **kwargs) -> dict:
        model = model or self.default_model
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={"model": model, "messages": messages, "stream": False, **kwargs},
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "content": data.get("message", {}).get("content", ""),
                "tokens": data.get("eval_count", 0) + data.get("prompt_eval_count", 0),
            }

    async def embed(self, texts: list[str], model: Optional[str] = None) -> list[list[float]]:
        model = model or self.embed_model
        # Ollama /api/embed supports batch input
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/embed",
                json={"model": model, "input": texts},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["embeddings"]


class OpenRouterProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.default_model = settings.OPENROUTER_MODEL
        self.base_url = "https://openrouter.ai/api/v1"

    async def chat(self, messages: list[dict], model: Optional[str] = None, **kwargs) -> dict:
        model = model or self.default_model
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "messages": messages, **kwargs},
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            usage = data.get("usage", {})
            return {
                "content": choice.get("content", ""),
                "tokens": usage.get("total_tokens", 0),
            }

    async def embed(self, texts: list[str], model: Optional[str] = None) -> list[list[float]]:
        # OpenRouter doesn't support embeddings natively; fall back to Ollama
        fallback = OllamaProvider()
        return await fallback.embed(texts, model)


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.default_model = settings.OPENAI_MODEL
        self.base_url = "https://api.openai.com/v1"

    async def chat(self, messages: list[dict], model: Optional[str] = None, **kwargs) -> dict:
        model = model or self.default_model
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "messages": messages, **kwargs},
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            usage = data.get("usage", {})
            return {
                "content": choice.get("content", ""),
                "tokens": usage.get("total_tokens", 0),
            }

    async def embed(self, texts: list[str], model: Optional[str] = None) -> list[list[float]]:
        model = model or "text-embedding-3-small"
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/embeddings",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "input": texts},
            )
            resp.raise_for_status()
            data = resp.json()
            return [item["embedding"] for item in data["data"]]


def get_llm_provider(provider_name: Optional[str] = None) -> LLMProvider:
    name = provider_name or settings.LLM_DEFAULT_PROVIDER
    providers = {
        "ollama": OllamaProvider,
        "openrouter": OpenRouterProvider,
        "openai": OpenAIProvider,
    }
    cls = providers.get(name)
    if not cls:
        raise ValueError(f"Unknown LLM provider: {name}")
    return cls()
