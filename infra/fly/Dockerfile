# One image, two runtimes: Node 20 (api + worker-ingest, uWS needs an LTS ABI) and Python 3.11 (worker-cortex).
# Build context is the REPO ROOT (see infra/fly/fly.toml): `fly deploy -c infra/fly/fly.toml` from repo root.
FROM node:20-bookworm-slim

# git = uWebSockets.js is a git dependency; python3/venv/pip + build-essential = cortex deps. Bookworm ships py3.11.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates python3 python3-venv python3-pip build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY . .

# JS workspace install + Prisma client generation.
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @omnipitch/api exec prisma generate

# Cortex Python venv (pricing math stays Python — ADR-004). Mirrors apps/worker-cortex/pyproject deps.
RUN python3 -m venv apps/worker-cortex/.venv \
    && apps/worker-cortex/.venv/bin/pip install --no-cache-dir --upgrade pip \
    && apps/worker-cortex/.venv/bin/pip install --no-cache-dir numpy redis penaltyblog

ENV NODE_ENV=production
EXPOSE 4000 4001

# No default CMD: Fly `[processes]` supplies the api / ingest / cortex commands per process group.
