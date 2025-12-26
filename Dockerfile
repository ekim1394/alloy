# Build stage
FROM rust:1.91-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY Cargo.toml Cargo.lock ./
COPY orchestrator ./orchestrator
COPY worker ./worker
COPY cli ./cli
COPY shared ./shared

# Build the orchestrator
RUN cargo build --release -p orchestrator

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=builder /app/target/release/orchestrator /app/orchestrator

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=10000
ENV DATABASE_MODE=local
ENV SQLITE_PATH=/app/data/alloy.db

EXPOSE 10000

CMD ["./orchestrator"]
