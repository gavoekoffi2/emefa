# IronClaw Agent Runtime
# Builds and runs the IronClaw Rust binary

FROM rust:1.85-bookworm AS builder

WORKDIR /build

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

COPY --from=builder /build/target/release/ironclaw /usr/local/bin/ironclaw

# Default environment
ENV LLM_BACKEND=ollama
ENV LLM_BASE_URL=http://ollama:11434
ENV LLM_MODEL=llama3.2:3b
ENV IRONCLAW_PORT=8090

EXPOSE 8090

CMD ["ironclaw", "run"]
