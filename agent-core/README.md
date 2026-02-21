# EMEFA Agent Core - IronClaw Wrapper

This module wraps [IronClaw](https://github.com/nearai/ironclaw) (Rust-based secure AI agent runtime)
as the agent engine for the EMEFA platform.

## Architecture

IronClaw runs as a standalone Rust binary (v0.9.0+), exposing HTTP APIs via its Web Gateway on port 3000.
EMEFA's backend communicates with IronClaw through HTTP calls.

### IronClaw APIs Used:
- **`/v1/chat/completions`** - OpenAI-compatible chat completions (any OpenAI SDK client works)
- **`/api/chat/send`** - Native gateway for richer agent features (job tracking, memory)
- **`/api/chat/events`** - SSE streaming for real-time responses
- **`/api/chat/ws`** - WebSocket for bidirectional communication
- **`/api/memory/*`** - Hybrid search (BM25 full-text + vector via RRF)
- **`/v1/models`** - List available models
- **`/health`** - Health check

### IronClaw Capabilities Used:
- **Agent Loop**: Message handling, parallel job coordination (up to 5 concurrent)
- **Tool Registry**: WASM-sandboxed tools with capability-based permissions + MCP server support
- **Safety Layer**: Prompt injection detection, content sanitization, credential leak detection
- **Memory/Workspace**: Persistent memory with hybrid full-text + vector search (Reciprocal Rank Fusion)
- **LLM Providers**: Ollama, OpenAI, Anthropic, OpenRouter, NEAR AI, any OpenAI-compatible endpoint
- **Self-repair**: Automatic recovery from stuck operations

### Integration Pattern:
1. EMEFA backend sends messages to IronClaw's `/v1/chat/completions` endpoint
2. IronClaw processes via agent loop (LLM reasoning + WASM tool execution in sandbox)
3. Response returned as OpenAI-compatible JSON (or streamed via SSE)
4. EMEFA backend stores conversation in its own PostgreSQL DB
5. If IronClaw is unavailable, client falls back to direct LLM call

## Configuration

IronClaw is configured via environment variables:
- `LLM_BACKEND` - Provider: `ollama`, `openai_compatible`, `openai`, `anthropic`, `nearai`
- `LLM_BASE_URL` - Provider endpoint URL
- `LLM_MODEL` - Model to use
- `LLM_API_KEY` - API key (for non-Ollama providers)
- `DATABASE_URL` - PostgreSQL connection (requires pgvector extension)
- `HTTP_HOST` / `HTTP_PORT` - Web Gateway bind address (default: 0.0.0.0:3000)
- `AGENT_MAX_PARALLEL_JOBS` - Max concurrent jobs (default: 5)
- `SAFETY_INJECTION_CHECK_ENABLED` - Enable prompt injection defense (default: true)

## Running

```bash
# Build from source (requires Rust 1.85+)
git clone https://github.com/nearai/ironclaw.git
cd ironclaw && cargo build --release
./target/release/ironclaw onboard  # Interactive setup wizard
./target/release/ironclaw run

# Or via Docker Compose (recommended)
docker compose up ironclaw -d
# IronClaw will be available at http://localhost:3001
```

## Fallback Behavior

If IronClaw is not running, the `IronClawClient` automatically falls back to calling
the configured LLM provider directly (Ollama/OpenRouter/OpenAI) via EMEFA's own
`LLMProvider` abstraction. This ensures the platform remains functional during
IronClaw maintenance or outages.
