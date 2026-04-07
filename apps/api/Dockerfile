# syntax=docker/dockerfile:1.7
#
# Build context: MONOREPO ROOT (not apps/api).
# Usage: docker build -f apps/api/Dockerfile -t duta-api .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /build

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache openssl
COPY apps/api/package.json apps/api/pnpm-lock.yaml ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
WORKDIR /build/apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ---- Development (for local compose override) ----
FROM base AS development
RUN apk add --no-cache openssl
COPY --from=deps /build/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /build/apps/api
CMD ["pnpm", "dev"]

# ---- Build ----
FROM base AS build
COPY --from=deps /build/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /build/apps/api
RUN pnpm build
# Prune dev dependencies for smaller runtime image.
# The generated Prisma client under node_modules/.prisma/ and @prisma/client
# survives prune because @prisma/client is a production dependency.
RUN pnpm prune --prod

# ---- Production runtime ----
FROM node:22-alpine AS production
RUN apk add --no-cache openssl curl dumb-init

WORKDIR /app

# Non-root user
RUN addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build --chown=app:app /build/apps/api/dist ./dist
COPY --from=build --chown=app:app /build/apps/api/node_modules ./node_modules
COPY --from=build --chown=app:app /build/apps/api/package.json ./package.json
COPY --from=build --chown=app:app /build/apps/api/prisma ./prisma

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3001/api/health || exit 1

# dumb-init as PID 1 for proper signal handling (critical for Phase 3 graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main"]
