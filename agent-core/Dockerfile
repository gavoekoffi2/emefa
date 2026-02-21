# IronClaw Agent Runtime
# Builds and runs the IronClaw Rust binary
# IronClaw requires Rust 1.85+ and PostgreSQL 15+ with pgvector

FROM rust:1.85-bookworm AS builder

WORKDIR /build

# Install build deps
RUN apt-get update && apt-get install -y pkg-config libssl-dev cmake && rm -rf /var/lib/apt/lists/*

# Clone IronClaw
RUN git clone --depth 1 https://github.com/nearai/ironclaw.git .

# Build release binary
RUN cargo build --release

# Runtime image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (IronClaw convention)
RUN useradd -m -u 1000 ironclaw
USER ironclaw

COPY --from=builder /build/target/release/ironclaw /usr/local/bin/ironclaw

# IronClaw Web Gateway listens on port 3000 by default
# Exposes: /v1/chat/completions (OpenAI-compatible), /api/chat/*, /api/memory/*, /health
ENV LLM_BACKEND=ollama
ENV LLM_BASE_URL=http://ollama:11434
ENV LLM_MODEL=llama3.2:3b
ENV HTTP_HOST=0.0.0.0
ENV HTTP_PORT=3000

EXPOSE 3000

CMD ["ironclaw", "run"]
