# syntax=docker/dockerfile:1.7
#
# Build context: MONOREPO ROOT (not apps/web).
# Usage: docker build -f apps/web/Dockerfile -t duta-web .
# This is required because the web build needs apps/api/openapi.json for orval code generation.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /build

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY apps/web/package.json apps/web/pnpm-lock.yaml ./apps/web/
WORKDIR /build/apps/web
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
# Copy the openapi spec from the api app (needed by orval)
COPY apps/api/openapi.json ./apps/api/openapi.json
# Copy web app source
COPY --from=deps /build/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web

WORKDIR /build/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env vars baked into the Next.js bundle (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LOGTO_ENDPOINT
ARG NEXT_PUBLIC_LOGTO_APP_ID
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_LOGTO_ENDPOINT=${NEXT_PUBLIC_LOGTO_ENDPOINT}
ENV NEXT_PUBLIC_LOGTO_APP_ID=${NEXT_PUBLIC_LOGTO_APP_ID}

RUN pnpm build

# ---- Production runtime ----
FROM node:22-alpine AS production
RUN apk add --no-cache curl dumb-init

WORKDIR /app

# Non-root user
RUN addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the Next.js standalone build + static assets + public
COPY --from=build --chown=app:app /build/apps/web/public ./public
COPY --from=build --chown=app:app /build/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /build/apps/web/.next/static ./.next/static

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
