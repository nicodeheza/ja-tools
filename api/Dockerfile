# syntax=docker/dockerfile:1

# ─── Stage 1: Base with system dependencies ───────────────────────────────
FROM node:22.23.4-slim AS base
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ─── Stage 2: Build and Deploy ──────────────────────────────────────────────────
FROM base AS builder
# Install build tools only needed for compilation (not in production)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy dependency files first to leverage Docker cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json  ./
# Copy subproject package.json files (adjust paths if you have more)
COPY api/package.json ./api/ 

# Install ALL dependencies (needed for compilation)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the API first
RUN pnpm --filter api build

# Download dict
RUN --mount=type=secret,id=r2_endpoint_url \
    --mount=type=secret,id=r2_access_key_id \
    --mount=type=secret,id=r2_secret_access_key \
    R2_ENDPOINT_URL=$(cat /run/secrets/r2_endpoint_url) \
    R2_ACCESS_KEY_ID=$(cat /run/secrets/r2_access_key_id) \
    R2_SECRET_ACCESS_KEY=$(cat /run/secrets/r2_secret_access_key) \
    node ./api/dist/scripts/dict/downloadDict

# Now deploy. This creates a folder at /app/isolated
# with compiled code and ONLY production dependencies.
RUN pnpm --filter api --prod deploy /app/isolated --legacy

# ─── Stage 3: Production (Runner) ────────────────────────────────────────────
FROM base AS runner

# Bring in the final isolated folder (with production node_modules and dist)
COPY --from=builder /app/isolated ./

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Since we're in the root of the isolated app, the path is direct
CMD ["node", "./dist/index"]