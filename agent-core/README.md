# EMEFA Agent Core - IronClaw Wrapper

This module wraps IronClaw (Rust-based secure AI agent runtime) as the agent engine
for the EMEFA platform.

## Architecture

IronClaw runs as a standalone Rust binary, exposing an HTTP API via its web gateway.
EMEFA's backend communicates with IronClaw through HTTP calls.

### IronClaw Capabilities Used:
- **Agent Loop**: Message handling, job coordination
- **Tool Registry**: WASM-sandboxed tools with capability-based permissions
- **Safety Layer**: Prompt injection defense, content sanitization
- **Memory/Workspace**: Persistent memory with vector + full-text search
- **LLM Providers**: Ollama, OpenAI-compatible, NEAR AI

### Integration Pattern:
1. EMEFA backend sends messages to IronClaw HTTP endpoint
2. IronClaw processes via agent loop (LLM reasoning + tool execution)
3. Response streamed back via SSE/WebSocket
4. EMEFA backend stores conversation in its own PostgreSQL DB

## Configuration

IronClaw is configured via environment variables:
- `LLM_BACKEND` - Provider (ollama, openai_compatible, etc.)
- `LLM_BASE_URL` - Provider endpoint
- `LLM_MODEL` - Model to use
- `DATABASE_URL` - PostgreSQL connection for IronClaw's internal state

## Running

```bash
# Build from source
cd ironclaw && cargo build --release

# Or use Docker
docker run -p 8090:8090 ghcr.io/nearai/ironclaw:latest
```
