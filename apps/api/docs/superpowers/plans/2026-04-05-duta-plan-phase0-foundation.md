# Duta Platform — Phase 0: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure from monorepo into 2 independent repos (duta-api + duta-web) with full Docker Compose infrastructure, Logto auth, NestJS DDD skeleton with OpenAPI, Next.js 15 with shadcn/ui + Orval client generation, and Nginx reverse proxy.

**Architecture:** Two independent git repos — `duta-api` (NestJS + DDD + Docker Compose for all infrastructure) and `duta-web` (Next.js 15 + Orval). They communicate via OpenAPI contract. Auth delegated to self-hosted Logto. All services run in Docker Compose on a single server.

**Tech Stack:** NestJS 10, Next.js 15, PostgreSQL 16, Redis 7, Typesense, Logto, Prisma 6, Orval, TanStack Query, shadcn/ui, Tailwind CSS v4, Docker Compose, Nginx

**Existing Code:** There is existing monorepo code at `/opt/duta` with `apps/api`, `apps/web`, `packages/db`, `packages/shared`. The Prisma schema and shared types are reusable. The custom JWT auth code will be replaced by Logto. The docs at `docs/superpowers/` must be preserved.

---

## File Structure

### duta-api (`/opt/duta-api/`)

```
duta-api/
├── .env.example
├── .env
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── docker-compose.yml                  # All infrastructure
├── docker-compose.override.yml         # Dev overrides (ports, volumes)
├── Dockerfile                          # API multi-stage build
├── Dockerfile.worker                   # Worker with FFmpeg
├── prisma/
│   ├── schema.prisma                   # Full DB schema
│   └── migrations/                     # Prisma migrations
├── scripts/
│   ├── generate-openapi.ts             # Script to export openapi.json
│   └── backup.sh                       # pg_dump → R2 backup script
├── openapi.json                        # Auto-generated, committed for Orval
├── src/
│   ├── main.ts                         # Bootstrap with Swagger
│   ├── app.module.ts                   # Root module
│   ├── config/
│   │   ├── config.module.ts            # @nestjs/config with validation
│   │   └── env.validation.ts           # Zod schema for env vars
│   ├── domain/
│   │   └── user/
│   │       ├── entities/
│   │       │   └── user.entity.ts      # User domain entity
│   │       └── ports/
│   │           └── user.repository.ts  # Repository interface
│   ├── application/
│   │   └── user/
│   │       ├── commands/
│   │       │   └── sync-user.command.ts
│   │       └── queries/
│   │           ├── get-profile.query.ts
│   │           └── update-profile.query.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── user.prisma-repository.ts
│   │   └── redis/
│   │       ├── redis.module.ts
│   │       └── redis.service.ts
│   ├── presentation/
│   │   └── rest/
│   │       ├── health/
│   │       │   └── health.controller.ts
│   │       └── user/
│   │           ├── user.controller.ts
│   │           ├── user.controller.spec.ts
│   │           └── dto/
│   │               ├── user-profile.dto.ts
│   │               └── update-profile.dto.ts
│   └── shared/
│       ├── guards/
│       │   └── logto-auth.guard.ts     # Verify Logto JWT
│       ├── decorators/
│       │   └── current-user.decorator.ts
│       ├── filters/
│       │   └── global-exception.filter.ts
│       └── interceptors/
│           └── logging.interceptor.ts
└── test/
    ├── jest-e2e.json
    └── app.e2e-spec.ts
```

### duta-web (`/opt/duta-web/`)

```
duta-web/
├── .env.example
├── .env.local
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json                     # shadcn/ui config
├── Dockerfile                          # Multi-stage Next.js build
├── orval.config.ts                     # Orval config → reads openapi.json
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── globals.css                 # Tailwind + OKLCH theme
│   │   ├── page.tsx                    # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── callback/page.tsx       # Logto callback
│   │   │   └── layout.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx              # Sidebar + auth guard
│   │       ├── dashboard/page.tsx
│   │       └── profile/page.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── sonner.tsx
│   │   ├── providers.tsx               # QueryClient + Logto + Theme
│   │   ├── auth-guard.tsx              # Client-side auth redirect
│   │   ├── dashboard-shell.tsx
│   │   ├── sidebar-nav.tsx
│   │   ├── user-nav.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── logto.ts                    # Logto client config
│   │   ├── api-client.ts              # Axios instance with Logto token
│   │   └── utils.ts                    # cn() helper
│   └── generated/
│       └── api/                        # Orval-generated (gitignored, generated on build)
│           ├── index.ts
│           ├── model/                  # TypeScript types from OpenAPI
│           └── hooks/                  # TanStack Query hooks
└── public/
    └── favicon.ico
```

---

### Task 1: Create duta-api Repository Skeleton

**Files:**
- Create: `/opt/duta-api/package.json`
- Create: `/opt/duta-api/tsconfig.json`
- Create: `/opt/duta-api/tsconfig.build.json`
- Create: `/opt/duta-api/nest-cli.json`
- Create: `/opt/duta-api/.eslintrc.js`
- Create: `/opt/duta-api/.prettierrc`
- Create: `/opt/duta-api/.gitignore`
- Create: `/opt/duta-api/.env.example`

- [ ] **Step 1: Initialize git repo and create package.json**

```bash
mkdir -p /opt/duta-api
cd /opt/duta-api
git init
```

```json
// package.json
{
  "name": "duta-api",
  "version": "0.1.0",
  "private": true,
  "description": "Duta Platform API — NestJS + DDD",
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "openapi:generate": "ts-node scripts/generate-openapi.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/swagger": "^8.1.0",
    "@prisma/client": "^6.4.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "helmet": "^8.0.0",
    "ioredis": "^5.4.0",
    "jwks-rsa": "^3.1.0",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "@nestjs/passport": "^10.0.3",
    "pino": "^9.6.0",
    "pino-pretty": "^13.0.0",
    "nestjs-pino": "^4.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/schematics": "^10.2.0",
    "@nestjs/testing": "^10.4.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^22.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-prettier": "^5.2.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.0",
    "prisma": "^6.4.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.0",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  },
  "engines": {
    "node": ">=20"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create TypeScript configs**

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

```json
// nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 3: Create linting and formatting configs**

```js
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

- [ ] **Step 4: Create .gitignore and .env.example**

```gitignore
# .gitignore
node_modules/
dist/
coverage/
.env
.env.local
*.log
.DS_Store

# Prisma
prisma/migrations/**/migration_lock.toml

# Docker volumes
postgres-data/
redis-data/
typesense-data/
grafana-data/
prometheus-data/
logto-data/
```

```bash
# .env.example

# Database
DATABASE_URL="postgresql://duta:duta_secret@localhost:5432/duta?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Logto
LOGTO_ENDPOINT="http://localhost:3302"
LOGTO_AUDIENCE="https://api.duta.val.id"
LOGTO_ISSUER="http://localhost:3302/oidc"
LOGTO_JWKS_URI="http://localhost:3302/oidc/jwks"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="duta-uploads"
R2_PUBLIC_URL=""

# Xendit
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""

# Resend (Email)
RESEND_API_KEY=""

# Sentry
SENTRY_DSN=""

# App
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

- [ ] **Step 5: Install dependencies**

```bash
cd /opt/duta-api
pnpm install
```

- [ ] **Step 6: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "chore: initialize duta-api repo with NestJS skeleton"
```

---

### Task 2: Docker Compose Infrastructure

**Files:**
- Create: `/opt/duta-api/docker-compose.yml`
- Create: `/opt/duta-api/docker-compose.override.yml`
- Create: `/opt/duta-api/Dockerfile`
- Create: `/opt/duta-api/scripts/backup.sh`
- Create: `/opt/duta-api/.dockerignore`

- [ ] **Step 1: Create docker-compose.yml with all services**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: duta
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-duta_secret}
      POSTGRES_DB: duta
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-logto-db.sql:/docker-entrypoint-initdb.d/01-logto.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U duta"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  typesense:
    image: typesense/typesense:27.1
    restart: unless-stopped
    environment:
      TYPESENSE_API_KEY: ${TYPESENSE_API_KEY:-duta_typesense_key}
      TYPESENSE_DATA_DIR: /data
    volumes:
      - typesense-data:/data
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:8108/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  logto:
    image: svhd/logto:latest
    restart: unless-stopped
    environment:
      TRUST_PROXY_HEADER: "1"
      DB_URL: postgresql://duta:${POSTGRES_PASSWORD:-duta_secret}@postgres:5432/logto
      ENDPOINT: ${LOGTO_PUBLIC_ENDPOINT:-http://localhost:3302}
      ADMIN_ENDPOINT: http://localhost:3301
    depends_on:
      postgres:
        condition: service_healthy
    entrypoint:
      ["sh", "-c", "npm run cli db seed -- --swe && npm start"]

  api:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://duta:${POSTGRES_PASSWORD:-duta_secret}@postgres:5432/duta?schema=public
      REDIS_URL: redis://redis:6379
      LOGTO_ENDPOINT: http://logto:3302
      LOGTO_AUDIENCE: ${LOGTO_AUDIENCE:-https://api.duta.val.id}
      LOGTO_ISSUER: ${LOGTO_PUBLIC_ENDPOINT:-http://localhost:3302}/oidc
      LOGTO_JWKS_URI: http://logto:3302/oidc/jwks
      NODE_ENV: production
      PORT: 3001
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  prometheus:
    image: prom/prometheus:v2.53.0
    restart: unless-stopped
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:11.4.0
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-duta_grafana}
      GF_SERVER_ROOT_URL: http://localhost:3100
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  postgres-data:
  redis-data:
  typesense-data:
  prometheus-data:
  grafana-data:
```

- [ ] **Step 2: Create docker-compose.override.yml for dev**

```yaml
# docker-compose.override.yml
# Dev overrides: expose ports, mount source code
services:
  postgres:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"

  typesense:
    ports:
      - "8108:8108"

  logto:
    ports:
      - "3301:3301"   # Admin console
      - "3302:3302"   # Auth endpoint

  api:
    build:
      target: development
    ports:
      - "3001:3001"
      - "9229:9229"   # Debug port
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
    command: ["pnpm", "dev"]
    environment:
      NODE_ENV: development

  prometheus:
    ports:
      - "9090:9090"

  grafana:
    ports:
      - "3100:3000"
```

- [ ] **Step 3: Create Dockerfile (multi-stage)**

```dockerfile
# Dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

- [ ] **Step 4: Create .dockerignore**

```
# .dockerignore
node_modules
dist
coverage
.git
.env
.env.local
*.md
postgres-data
redis-data
typesense-data
grafana-data
prometheus-data
```

- [ ] **Step 5: Create init-logto-db.sql**

```sql
-- scripts/init-logto-db.sql
-- Creates a separate database for Logto within the same PostgreSQL instance
SELECT 'CREATE DATABASE logto OWNER duta'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'logto')\gexec
```

- [ ] **Step 6: Create Prometheus config**

```yaml
# config/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'duta-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/api/metrics'
```

- [ ] **Step 7: Verify Docker Compose is valid**

```bash
cd /opt/duta-api
docker compose config --quiet
```
Expected: No errors

- [ ] **Step 8: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "infra: add Docker Compose with PostgreSQL, Redis, Typesense, Logto, Prometheus, Grafana"
```

---

### Task 3: Prisma Schema & Database Setup

**Files:**
- Create: `/opt/duta-api/prisma/schema.prisma`
- Migrate from: `/opt/duta/packages/db/prisma/schema.prisma`

The existing Prisma schema is comprehensive and matches the spec's data model. We need to:
1. Copy it to the new repo
2. Add `Notification` model (missing from existing schema)
3. Add `verificationTier` to User (missing)
4. Update DATABASE_URL for Docker

- [ ] **Step 1: Create the Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ──────────────────────────────────────────

enum UserRole {
  owner
  clipper
  admin
}

enum KycStatus {
  none
  pending
  verified
  rejected
}

enum VerificationTier {
  tier0
  tier1
  tier2
  tier3
}

enum CampaignType {
  bounty
  gig
  podcast
}

enum CampaignStatus {
  draft
  active
  paused
  completed
}

enum ClipStatus {
  submitted
  under_review
  approved
  revision
  rejected
}

enum TransactionType {
  deposit
  payout
  refund
  fee
}

enum TransactionStatus {
  pending
  processing
  completed
  failed
}

enum DisputeStatus {
  open
  under_review
  resolved
}

enum NotificationType {
  campaign_joined
  clip_submitted
  clip_approved
  clip_rejected
  clip_revision
  payment_received
  payment_sent
  dispute_opened
  dispute_resolved
  message_received
  system
}

// ─── Models ─────────────────────────────────────────

model User {
  id               String           @id @default(cuid())
  logtoId          String?          @unique @map("logto_id")
  email            String           @unique
  name             String
  role             UserRole
  bio              String?
  avatarUrl        String?          @map("avatar_url")
  nicheTags        String[]         @default([]) @map("niche_tags")
  socialLinks      Json?            @map("social_links")
  kycStatus        KycStatus        @default(none) @map("kyc_status")
  kycDocumentUrl   String?          @map("kyc_document_url")
  clipperScore     Int              @default(0) @map("clipper_score")
  verificationTier VerificationTier @default(tier0) @map("verification_tier")
  emailVerified    Boolean          @default(false) @map("email_verified")
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  campaigns        Campaign[]
  clips            Clip[]
  transactionsFrom Transaction[]    @relation("TransactionFrom")
  transactionsTo   Transaction[]    @relation("TransactionTo")
  sentMessages     Message[]        @relation("MessageSender")
  reviewsGiven     Review[]         @relation("ReviewerRel")
  reviewsReceived  Review[]         @relation("RevieweeRel")
  disputesRaised   Dispute[]        @relation("DisputeRaiser")
  disputesAgainst  Dispute[]        @relation("DisputeTarget")
  disputesResolved Dispute[]        @relation("DisputeResolver")
  notifications    Notification[]
  conversationParticipants ConversationParticipant[]

  @@map("users")
}

model Campaign {
  id              String         @id @default(cuid())
  ownerId         String         @map("owner_id")
  type            CampaignType
  title           String
  description     String
  guidelines      String?
  sourceType      String?        @map("source_type")
  sourceUrl       String?        @map("source_url")
  sourceFileKey   String?        @map("source_file_key")
  sourceMetadata  Json?          @map("source_metadata")
  ratePerKViews   Int?           @map("rate_per_k_views")
  budgetTotal     Int            @map("budget_total")
  budgetSpent     Int            @default(0) @map("budget_spent")
  targetPlatforms String[]       @default([]) @map("target_platforms")
  status          CampaignStatus @default(draft)
  deadline        DateTime?
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  owner           User           @relation(fields: [ownerId], references: [id])
  clips           Clip[]
  escrow          EscrowAccount?
  transactions    Transaction[]
  podcastEpisodes PodcastEpisode[]
  reviews         Review[]
  disputes        Dispute[]
  conversations   Conversation[]

  @@index([ownerId])
  @@index([status])
  @@index([type])
  @@map("campaigns")
}

model Clip {
  id              String     @id @default(cuid())
  campaignId      String     @map("campaign_id")
  clipperId       String     @map("clipper_id")
  fileKey         String?    @map("file_key")
  postedUrl       String?    @map("posted_url")
  platform        String?
  status          ClipStatus @default(submitted)
  reviewFeedback  String?    @map("review_feedback")
  viewsVerified   Int        @default(0) @map("views_verified")
  earningsAmount  Int        @default(0) @map("earnings_amount")
  submittedAt     DateTime   @default(now()) @map("submitted_at")
  reviewedAt      DateTime?  @map("reviewed_at")
  createdAt       DateTime   @default(now()) @map("created_at")

  campaign        Campaign   @relation(fields: [campaignId], references: [id])
  clipper         User       @relation(fields: [clipperId], references: [id])
  transactions    Transaction[]
  reviews         Review[]
  disputes        Dispute[]

  @@index([campaignId])
  @@index([clipperId])
  @@index([status])
  @@map("clips")
}

model EscrowAccount {
  id             String   @id @default(cuid())
  campaignId     String   @unique @map("campaign_id")
  totalDeposited Int      @default(0) @map("total_deposited")
  totalReleased  Int      @default(0) @map("total_released")
  totalRefunded  Int      @default(0) @map("total_refunded")
  balance        Int      @default(0)
  status         String   @default("active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  campaign       Campaign @relation(fields: [campaignId], references: [id])

  @@map("escrow_accounts")
}

model Transaction {
  id               String            @id @default(cuid())
  type             TransactionType
  fromUserId       String?           @map("from_user_id")
  toUserId         String?           @map("to_user_id")
  campaignId       String?           @map("campaign_id")
  clipId           String?           @map("clip_id")
  amount           Int
  currency         String            @default("IDR")
  status           TransactionStatus @default(pending)
  paymentMethod    String?           @map("payment_method")
  paymentReference String?           @map("payment_reference")
  createdAt        DateTime          @default(now()) @map("created_at")

  fromUser         User?     @relation("TransactionFrom", fields: [fromUserId], references: [id])
  toUser           User?     @relation("TransactionTo", fields: [toUserId], references: [id])
  campaign         Campaign? @relation(fields: [campaignId], references: [id])
  clip             Clip?     @relation(fields: [clipId], references: [id])

  @@index([fromUserId])
  @@index([toUserId])
  @@index([campaignId])
  @@map("transactions")
}

model PodcastEpisode {
  id                 String   @id @default(cuid())
  campaignId         String   @map("campaign_id")
  title              String
  description        String?
  audioUrl           String?  @map("audio_url")
  audioFileKey       String?  @map("audio_file_key")
  transcriptText     String?  @map("transcript_text")
  transcriptSegments Json?    @map("transcript_segments")
  suggestedMoments   Json?    @map("suggested_moments")
  duration           Int?
  createdAt          DateTime @default(now()) @map("created_at")

  campaign           Campaign @relation(fields: [campaignId], references: [id])

  @@index([campaignId])
  @@map("podcast_episodes")
}

model Conversation {
  id           String    @id @default(cuid())
  campaignId   String?   @map("campaign_id")
  type         String    @default("direct")
  createdAt    DateTime  @default(now()) @map("created_at")

  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  messages     Message[]
  participants ConversationParticipant[]

  @@map("conversations")
}

model ConversationParticipant {
  id             String   @id @default(cuid())
  conversationId String   @map("conversation_id")
  userId         String   @map("user_id")
  joinedAt       DateTime @default(now()) @map("joined_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

model Message {
  id             String    @id @default(cuid())
  conversationId String    @map("conversation_id")
  senderId       String    @map("sender_id")
  content        String
  attachments    Json?
  readAt         DateTime? @map("read_at")
  createdAt      DateTime  @default(now()) @map("created_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation("MessageSender", fields: [senderId], references: [id])

  @@index([conversationId])
  @@map("messages")
}

model Review {
  id         String   @id @default(cuid())
  reviewerId String   @map("reviewer_id")
  revieweeId String   @map("reviewee_id")
  campaignId String?  @map("campaign_id")
  clipId     String?  @map("clip_id")
  rating     Int
  categories Json?
  comment    String?
  revealed   Boolean  @default(false)
  createdAt  DateTime @default(now()) @map("created_at")

  reviewer   User     @relation("ReviewerRel", fields: [reviewerId], references: [id])
  reviewee   User     @relation("RevieweeRel", fields: [revieweeId], references: [id])
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
  clip       Clip?    @relation(fields: [clipId], references: [id])

  @@index([revieweeId])
  @@map("reviews")
}

model Dispute {
  id           String        @id @default(cuid())
  campaignId   String?       @map("campaign_id")
  clipId       String?       @map("clip_id")
  raisedById   String        @map("raised_by_id")
  againstId    String        @map("against_id")
  reason       String
  evidence     Json?
  status       DisputeStatus @default(open)
  resolution   String?
  resolvedById String?       @map("resolved_by_id")
  createdAt    DateTime      @default(now()) @map("created_at")
  resolvedAt   DateTime?     @map("resolved_at")

  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  clip         Clip?     @relation(fields: [clipId], references: [id])
  raisedBy     User      @relation("DisputeRaiser", fields: [raisedById], references: [id])
  against      User      @relation("DisputeTarget", fields: [againstId], references: [id])
  resolvedBy   User?     @relation("DisputeResolver", fields: [resolvedById], references: [id])

  @@index([status])
  @@map("disputes")
}

model Notification {
  id        String           @id @default(cuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  body      String
  data      Json?
  readAt    DateTime?        @map("read_at")
  createdAt DateTime         @default(now()) @map("created_at")

  user      User             @relation(fields: [userId], references: [id])

  @@index([userId, readAt])
  @@map("notifications")
}
```

Key changes from old schema:
- Added `logtoId` to User (unique, links to Logto sub claim)
- Added `verificationTier` enum and field to User
- Added `categories` and `revealed` to Review (for mutual reveal)
- Added `Notification` model with `NotificationType` enum
- Added `Conversation` → `Campaign` relation
- Added `ConversationParticipant` → `User` relation
- Removed `passwordHash` from User (auth handled by Logto)

- [ ] **Step 2: Create .env for local development**

```bash
cd /opt/duta-api
cp .env.example .env
# Edit .env with actual local values:
# DATABASE_URL="postgresql://duta:duta_secret@localhost:5432/duta?schema=public"
```

- [ ] **Step 3: Start PostgreSQL and run first migration**

```bash
cd /opt/duta-api
docker compose up -d postgres
# Wait for healthy
sleep 3
pnpm prisma migrate dev --name init
```

Expected: Migration created in `prisma/migrations/`, database tables created.

- [ ] **Step 4: Verify schema by running prisma generate**

```bash
cd /opt/duta-api
pnpm prisma generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 5: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "feat: add Prisma schema with all domain models and initial migration"
```

---

### Task 4: NestJS DDD Foundation & Config Module

**Files:**
- Create: `/opt/duta-api/src/config/config.module.ts`
- Create: `/opt/duta-api/src/config/env.validation.ts`
- Create: `/opt/duta-api/src/infrastructure/persistence/prisma.service.ts`
- Create: `/opt/duta-api/src/infrastructure/persistence/prisma.module.ts`
- Create: `/opt/duta-api/src/infrastructure/redis/redis.service.ts`
- Create: `/opt/duta-api/src/infrastructure/redis/redis.module.ts`
- Create: `/opt/duta-api/src/shared/filters/global-exception.filter.ts`
- Create: `/opt/duta-api/src/shared/interceptors/logging.interceptor.ts`
- Create: `/opt/duta-api/src/app.module.ts`
- Create: `/opt/duta-api/src/main.ts`

- [ ] **Step 1: Write failing test for config validation**

```typescript
// src/config/env.validation.spec.ts
import { validateEnv } from './env.validation';

describe('env.validation', () => {
  it('should reject missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow();
  });

  it('should accept valid config', () => {
    const config = validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      LOGTO_ENDPOINT: 'http://localhost:3302',
      LOGTO_AUDIENCE: 'https://api.duta.val.id',
      LOGTO_JWKS_URI: 'http://localhost:3302/oidc/jwks',
      PORT: '3001',
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:3000',
    });
    expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    expect(config.PORT).toBe(3001);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern env.validation
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement env.validation.ts**

```typescript
// src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  LOGTO_ENDPOINT: z.string().url(),
  LOGTO_AUDIENCE: z.string(),
  LOGTO_JWKS_URI: z.string().url(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('duta-uploads'),
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.parse(config);
  return parsed;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern env.validation
```

Expected: PASS

- [ ] **Step 5: Create config module**

```typescript
// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
```

- [ ] **Step 6: Create Prisma service and module**

```typescript
// src/infrastructure/persistence/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/infrastructure/persistence/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 7: Create Redis service and module**

```typescript
// src/infrastructure/redis/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    super(configService.get<string>('REDIS_URL')!);
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
```

```typescript
// src/infrastructure/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

- [ ] **Step 8: Create global exception filter**

```typescript
// src/shared/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} ${status}`, exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

- [ ] **Step 9: Create logging interceptor**

```typescript
// src/shared/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.logger.log(`${method} ${url} — ${elapsed}ms`);
      }),
    );
  }
}
```

- [ ] **Step 10: Create app.module.ts**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule],
})
export class AppModule {}
```

- [ ] **Step 11: Create main.ts with Swagger**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes, filters, interceptors
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Duta API')
    .setDescription('Duta Content Clipping Marketplace API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`Duta API running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 12: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "feat: add NestJS DDD foundation with config, Prisma, Redis, Swagger"
```

---

### Task 5: OpenAPI Auto-Generation Script

**Files:**
- Create: `/opt/duta-api/scripts/generate-openapi.ts`
- Create: `/opt/duta-api/src/presentation/rest/health/health.controller.ts`

This script builds the NestJS app in memory, extracts the OpenAPI document, and writes it to `openapi.json`. The frontend repo (duta-web) reads this file to generate typed hooks via Orval.

- [ ] **Step 1: Write the health controller (first endpoint for OpenAPI)**

```typescript
// src/presentation/rest/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 2: Create health module and register in app.module**

```typescript
// src/presentation/rest/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

Update `src/app.module.ts` — add `HealthModule` to imports:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './presentation/rest/health/health.module';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, HealthModule],
})
export class AppModule {}
```

- [ ] **Step 3: Create the OpenAPI generation script**

```typescript
// scripts/generate-openapi.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Duta API')
    .setDescription('Duta Content Clipping Marketplace API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = resolve(__dirname, '..', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outputPath}`);
  await app.close();
}

generateOpenApi();
```

- [ ] **Step 4: Generate the OpenAPI spec**

```bash
cd /opt/duta-api
pnpm openapi:generate
```

Expected: `openapi.json` created with health endpoint.

- [ ] **Step 5: Verify the spec is valid JSON with health endpoint**

```bash
cd /opt/duta-api
cat openapi.json | python3 -m json.tool | head -30
```

Expected: Valid JSON with `/api/health` path.

- [ ] **Step 6: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "feat: add health endpoint and OpenAPI auto-generation script"
```

---

### Task 6: Logto Auth Guard (API)

**Files:**
- Create: `/opt/duta-api/src/shared/guards/logto-auth.guard.ts`
- Create: `/opt/duta-api/src/shared/guards/logto-auth.guard.spec.ts`
- Create: `/opt/duta-api/src/shared/decorators/current-user.decorator.ts`
- Create: `/opt/duta-api/src/shared/decorators/public.decorator.ts`

The Logto auth guard verifies JWTs issued by Logto using JWKS (JSON Web Key Set). It extracts the `sub` claim (Logto user ID) and attaches it to the request. The `@CurrentUser()` decorator retrieves it in controllers.

- [ ] **Step 1: Write failing test for Logto auth guard**

```typescript
// src/shared/guards/logto-auth.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogtoAuthGuard } from './logto-auth.guard';
import { Reflector } from '@nestjs/core';

describe('LogtoAuthGuard', () => {
  let guard: LogtoAuthGuard;
  let configService: Partial<ConfigService>;
  let reflector: Partial<Reflector>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          LOGTO_JWKS_URI: 'http://localhost:3302/oidc/jwks',
          LOGTO_AUDIENCE: 'https://api.duta.val.id',
        };
        return config[key];
      }),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    guard = new LogtoAuthGuard(
      configService as ConfigService,
      reflector as Reflector,
    );
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow public routes', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern logto-auth.guard
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the Public decorator**

```typescript
// src/shared/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 4: Implement the Logto auth guard**

```typescript
// src/shared/guards/logto-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { expressJwtSecret, GetVerificationKey } from 'jwks-rsa';
import { verify } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface LogtoJwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  scope?: string;
}

@Injectable()
export class LogtoAuthGuard implements CanActivate {
  private readonly logger = new Logger(LogtoAuthGuard.name);
  private readonly jwksClient: GetVerificationKey;
  private readonly audience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.audience = this.configService.get<string>('LOGTO_AUDIENCE')!;

    this.jwksClient = expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: this.configService.get<string>('LOGTO_JWKS_URI')!,
    }) as unknown as GetVerificationKey;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = await this.verifyToken(token);
      request.user = { sub: decoded.sub, scope: decoded.scope };
      return true;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private verifyToken(token: string): Promise<LogtoJwtPayload> {
    return new Promise((resolve, reject) => {
      verify(
        token,
        (header, callback) => {
          this.jwksClient(
            { header } as never,
            {} as never,
            (_err: Error | null, signingKey?: string) => {
              callback(null, signingKey);
            },
          );
        },
        { audience: this.audience, algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as LogtoJwtPayload);
        },
      );
    });
  }
}
```

- [ ] **Step 5: Create CurrentUser decorator**

```typescript
// src/shared/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string;
  scope?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user[data] : user;
  },
);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern logto-auth.guard
```

Expected: PASS

- [ ] **Step 7: Register the guard globally in app.module.ts**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './presentation/rest/health/health.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
```

Mark the health endpoint as `@Public()`:

```typescript
// src/presentation/rest/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 8: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "feat: add Logto JWT auth guard with JWKS verification and @Public decorator"
```

---

### Task 7: User Domain & Profile Endpoints

**Files:**
- Create: `/opt/duta-api/src/domain/user/entities/user.entity.ts`
- Create: `/opt/duta-api/src/domain/user/ports/user.repository.ts`
- Create: `/opt/duta-api/src/infrastructure/persistence/user.prisma-repository.ts`
- Create: `/opt/duta-api/src/presentation/rest/user/dto/user-profile.dto.ts`
- Create: `/opt/duta-api/src/presentation/rest/user/dto/update-profile.dto.ts`
- Create: `/opt/duta-api/src/presentation/rest/user/user.controller.ts`
- Create: `/opt/duta-api/src/presentation/rest/user/user.controller.spec.ts`
- Create: `/opt/duta-api/src/presentation/rest/user/user.module.ts`

- [ ] **Step 1: Write failing test for user controller**

```typescript
// src/presentation/rest/user/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { PrismaService } from '@/infrastructure/persistence/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile for valid logto sub', async () => {
      const mockUser = {
        id: 'user1',
        logtoId: 'logto-sub-123',
        email: 'rina@example.com',
        name: 'Rina',
        role: 'clipper',
        bio: null,
        avatarUrl: null,
        nicheTags: [],
        socialLinks: null,
        kycStatus: 'none',
        clipperScore: 0,
        verificationTier: 'tier0',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getProfile({ sub: 'logto-sub-123' } as never);
      expect(result).toBeDefined();
      expect(result.email).toBe('rina@example.com');
    });

    it('should sync new user from Logto on first access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'new-user',
        logtoId: 'logto-sub-new',
        email: 'new@example.com',
        name: 'New User',
        role: 'clipper',
        verificationTier: 'tier0',
      });

      const result = await controller.getProfile({
        sub: 'logto-sub-new',
        email: 'new@example.com',
        name: 'New User',
      } as never);
      expect(result).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern user.controller
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create user domain entity**

```typescript
// src/domain/user/entities/user.entity.ts
import { UserRole, KycStatus, VerificationTier } from '@prisma/client';

export class UserEntity {
  readonly id: string;
  readonly logtoId: string | null;
  readonly email: string;
  name: string;
  role: UserRole;
  bio: string | null;
  avatarUrl: string | null;
  nicheTags: string[];
  socialLinks: Record<string, string> | null;
  kycStatus: KycStatus;
  clipperScore: number;
  verificationTier: VerificationTier;
  emailVerified: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserEntity> & { id: string; email: string; name: string; role: UserRole }) {
    Object.assign(this, {
      logtoId: null,
      bio: null,
      avatarUrl: null,
      nicheTags: [],
      socialLinks: null,
      kycStatus: KycStatus.none,
      clipperScore: 0,
      verificationTier: VerificationTier.tier0,
      emailVerified: false,
      ...props,
    });
  }
}
```

- [ ] **Step 4: Create user repository port (interface)**

```typescript
// src/domain/user/ports/user.repository.ts
import { UserEntity } from '../entities/user.entity';

export interface UserRepository {
  findByLogtoId(logtoId: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  upsertByLogtoId(logtoId: string, data: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

- [ ] **Step 5: Create DTOs with OpenAPI decorators**

```typescript
// src/presentation/rest/user/dto/user-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['owner', 'clipper', 'admin'] }) role: string;
  @ApiPropertyOptional() bio: string | null;
  @ApiPropertyOptional() avatarUrl: string | null;
  @ApiProperty({ type: [String] }) nicheTags: string[];
  @ApiPropertyOptional({ type: Object }) socialLinks: Record<string, string> | null;
  @ApiProperty({ enum: ['none', 'pending', 'verified', 'rejected'] }) kycStatus: string;
  @ApiProperty() clipperScore: number;
  @ApiProperty({ enum: ['tier0', 'tier1', 'tier2', 'tier3'] }) verificationTier: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() createdAt: Date;
}
```

```typescript
// src/presentation/rest/user/dto/update-profile.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nicheTags?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ enum: ['owner', 'clipper'] })
  @IsOptional()
  @IsString()
  role?: 'owner' | 'clipper';
}
```

- [ ] **Step 6: Create user controller**

```typescript
// src/presentation/rest/user/user.controller.ts
import { Controller, Get, Patch, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { PrismaService } from '@/infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '@/shared/decorators/current-user.decorator';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserProfileDto> {
    let dbUser = await this.prisma.user.findUnique({
      where: { logtoId: user.sub },
    });

    if (!dbUser) {
      // First-time login: sync user from Logto claims
      dbUser = await this.prisma.user.upsert({
        where: { logtoId: user.sub },
        update: {},
        create: {
          logtoId: user.sub,
          email: (user as Record<string, string>).email ?? `${user.sub}@logto.local`,
          name: (user as Record<string, string>).name ?? 'New User',
          role: 'clipper',
        },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      bio: dbUser.bio,
      avatarUrl: dbUser.avatarUrl,
      nicheTags: dbUser.nicheTags,
      socialLinks: dbUser.socialLinks as Record<string, string> | null,
      kycStatus: dbUser.kycStatus,
      clipperScore: dbUser.clipperScore,
      verificationTier: dbUser.verificationTier,
      emailVerified: dbUser.emailVerified,
      createdAt: dbUser.createdAt,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const dbUser = await this.prisma.user.findUnique({
      where: { logtoId: user.sub },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.nicheTags && { nicheTags: dto.nicheTags }),
        ...(dto.socialLinks !== undefined && { socialLinks: dto.socialLinks }),
        ...(dto.role && { role: dto.role }),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      nicheTags: updated.nicheTags,
      socialLinks: updated.socialLinks as Record<string, string> | null,
      kycStatus: updated.kycStatus,
      clipperScore: updated.clipperScore,
      verificationTier: updated.verificationTier,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt,
    };
  }
}
```

- [ ] **Step 7: Create user module and register in app**

```typescript
// src/presentation/rest/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
})
export class UserModule {}
```

Update `src/app.module.ts` — add `UserModule`:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './presentation/rest/health/health.module';
import { UserModule } from './presentation/rest/user/user.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, HealthModule, UserModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Run tests**

```bash
cd /opt/duta-api
pnpm test -- --testPathPattern user.controller
```

Expected: PASS

- [ ] **Step 9: Regenerate OpenAPI spec with user endpoints**

```bash
cd /opt/duta-api
pnpm openapi:generate
```

Expected: `openapi.json` now includes `/api/users/me` GET and PATCH.

- [ ] **Step 10: Commit**

```bash
cd /opt/duta-api
git add .
git commit -m "feat: add user domain entity and profile endpoints (GET/PATCH /users/me)"
```

---

### Task 8: Create duta-web Repository Skeleton

**Files:**
- Create: `/opt/duta-web/package.json`
- Create: `/opt/duta-web/next.config.ts`
- Create: `/opt/duta-web/tsconfig.json`
- Create: `/opt/duta-web/tailwind.config.ts`
- Create: `/opt/duta-web/postcss.config.js`
- Create: `/opt/duta-web/components.json`
- Create: `/opt/duta-web/.env.example`
- Create: `/opt/duta-web/.gitignore`
- Create: `/opt/duta-web/Dockerfile`

- [ ] **Step 1: Initialize repo and create package.json**

```bash
mkdir -p /opt/duta-web
cd /opt/duta-web
git init
```

```json
// package.json
{
  "name": "duta-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "pnpm api:generate && next build",
    "start": "next start",
    "lint": "next lint",
    "api:generate": "orval",
    "api:watch": "orval --watch"
  },
  "dependencies": {
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@logto/react": "^4.0.0",
    "@tanstack/react-query": "^5.64.0",
    "axios": "^1.7.0",
    "zustand": "^5.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.468.0",
    "sonner": "^2.0.0",
    "next-themes": "^0.4.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "framer-motion": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.5.0",
    "orval": "^7.5.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.2.0",
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  },
  "engines": {
    "node": ">=20"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create TypeScript config**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create Next.js config**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create Tailwind CSS v4 config with OKLCH**

```css
/* src/app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme {
  /* OKLCH color system — dark-first design */
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-card: oklch(0.17 0 0);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.17 0 0);
  --color-popover-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.72 0.19 155);       /* Duta green */
  --color-primary-foreground: oklch(0.145 0 0);
  --color-secondary: oklch(0.25 0.005 0);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.25 0.005 0);
  --color-muted-foreground: oklch(0.65 0 0);
  --color-accent: oklch(0.25 0.005 0);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.60 0.22 25);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-border: oklch(0.3 0.005 0);
  --color-input: oklch(0.3 0.005 0);
  --color-ring: oklch(0.72 0.19 155);
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

:root.light {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.55 0.19 155);
  --color-primary-foreground: oklch(1 0 0);
  --color-secondary: oklch(0.96 0.005 0);
  --color-secondary-foreground: oklch(0.145 0 0);
  --color-muted: oklch(0.96 0.005 0);
  --color-muted-foreground: oklch(0.45 0 0);
  --color-accent: oklch(0.96 0.005 0);
  --color-accent-foreground: oklch(0.145 0 0);
  --color-destructive: oklch(0.55 0.22 25);
  --color-destructive-foreground: oklch(1 0 0);
  --color-border: oklch(0.9 0.005 0);
  --color-input: oklch(0.9 0.005 0);
  --color-ring: oklch(0.55 0.19 155);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 5: Create shadcn/ui components.json**

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 6: Create utility and .env files**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```bash
# .env.example
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_LOGTO_ENDPOINT="http://localhost:3302"
NEXT_PUBLIC_LOGTO_APP_ID=""
NEXT_PUBLIC_LOGTO_CALLBACK_URL="http://localhost:3000/callback"
```

- [ ] **Step 7: Create .gitignore and Dockerfile**

```gitignore
# .gitignore
node_modules/
.next/
out/
coverage/
.env
.env.local
*.log
.DS_Store
src/generated/
```

```dockerfile
# Dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 8: Install dependencies**

```bash
cd /opt/duta-web
pnpm install
```

- [ ] **Step 9: Commit**

```bash
cd /opt/duta-web
git add .
git commit -m "chore: initialize duta-web repo with Next.js 15, Tailwind v4, shadcn/ui"
```

---

### Task 9: Orval Client Generation

**Files:**
- Create: `/opt/duta-web/orval.config.ts`
- Copy: `/opt/duta-api/openapi.json` → accessible path for Orval

Orval reads the OpenAPI spec from duta-api and generates TypeScript types + TanStack Query hooks.

- [ ] **Step 1: Create Orval config**

```typescript
// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  duta: {
    input: {
      target: '../duta-api/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api',
      schemas: './src/generated/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/api-client.ts',
          name: 'apiClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
```

- [ ] **Step 2: Create the API client (Axios instance with Logto token)**

```typescript
// src/lib/api-client.ts
import Axios, { type AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export const apiClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error -- Orval expects cancel property on promise
  promise.cancel = () => source.cancel('Query was cancelled');

  return promise;
};

export default apiClient;
```

- [ ] **Step 3: Generate the API client from OpenAPI spec**

```bash
cd /opt/duta-web
pnpm api:generate
```

Expected: Files generated in `src/generated/api/` with TypeScript types and TanStack Query hooks for health and user endpoints.

- [ ] **Step 4: Verify generated types exist**

```bash
ls -la /opt/duta-web/src/generated/api/
```

Expected: `model/` directory with types, hook files for health and user tags.

- [ ] **Step 5: Commit**

```bash
cd /opt/duta-web
git add orval.config.ts src/lib/api-client.ts
git commit -m "feat: add Orval config for OpenAPI → TanStack Query code generation"
```

Note: `src/generated/` is gitignored — it's regenerated on build.

---

### Task 10: Logto Auth Integration (Web)

**Files:**
- Create: `/opt/duta-web/src/lib/logto.ts`
- Create: `/opt/duta-web/src/components/providers.tsx`
- Create: `/opt/duta-web/src/components/auth-guard.tsx`
- Create: `/opt/duta-web/src/app/callback/page.tsx`
- Create: `/opt/duta-web/src/app/layout.tsx`

- [ ] **Step 1: Create Logto client config**

```typescript
// src/lib/logto.ts
import { LogtoConfig } from '@logto/react';

export const logtoConfig: LogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  resources: [process.env.NEXT_PUBLIC_API_URL!],
  scopes: ['openid', 'profile', 'email'],
};
```

- [ ] **Step 2: Create providers wrapper**

```tsx
// src/components/providers.tsx
'use client';

import { LogtoProvider } from '@logto/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { logtoConfig } from '@/lib/logto';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <LogtoProvider config={logtoConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </LogtoProvider>
  );
}
```

- [ ] **Step 3: Create auth guard component**

```tsx
// src/components/auth-guard.tsx
'use client';

import { useLogto } from '@logto/react';
import { useEffect, type ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, signIn } = useLogto();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn(window.location.origin + '/callback');
    }
  }, [isAuthenticated, isLoading, signIn]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

- [ ] **Step 4: Create Logto callback page**

```tsx
// src/app/callback/page.tsx
'use client';

import { useHandleSignInCallback } from '@logto/react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  const { isLoading } = useHandleSignInCallback(() => {
    router.push('/dashboard');
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 5: Create root layout with providers**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Duta — Viralkan Kontenmu',
  description:
    'Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Set up API client to inject Logto access token**

```typescript
// src/lib/api-client.ts (updated)
import Axios, { type AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Token will be set by the auth provider after login
let getAccessToken: (() => Promise<string>) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed, proceed without auth
    }
  }
  return config;
});

export const apiClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error -- Orval expects cancel property on promise
  promise.cancel = () => source.cancel('Query was cancelled');

  return promise;
};

export default apiClient;
```

Update providers to inject the token getter:

```tsx
// Add to src/components/providers.tsx, inside the Providers component:
// After the LogtoProvider, add a child component that bridges the token:

import { setAccessTokenGetter } from '@/lib/api-client';

function LogtoTokenBridge() {
  const { getAccessToken } = useLogto();

  useEffect(() => {
    setAccessTokenGetter(() =>
      getAccessToken(process.env.NEXT_PUBLIC_API_URL!),
    );
  }, [getAccessToken]);

  return null;
}

// Render <LogtoTokenBridge /> inside LogtoProvider in the Providers component
```

- [ ] **Step 7: Commit**

```bash
cd /opt/duta-web
git add .
git commit -m "feat: add Logto auth integration with callback, auth guard, and token injection"
```

---

### Task 11: Frontend Shell & Design System

**Files:**
- Create: `/opt/duta-web/src/components/ui/button.tsx`
- Create: `/opt/duta-web/src/components/ui/input.tsx`
- Create: `/opt/duta-web/src/components/ui/label.tsx`
- Create: `/opt/duta-web/src/components/ui/card.tsx`
- Create: `/opt/duta-web/src/components/ui/badge.tsx`
- Create: `/opt/duta-web/src/components/ui/avatar.tsx`
- Create: `/opt/duta-web/src/components/ui/skeleton.tsx`
- Create: `/opt/duta-web/src/components/sidebar-nav.tsx`
- Create: `/opt/duta-web/src/components/user-nav.tsx`
- Create: `/opt/duta-web/src/components/theme-toggle.tsx`
- Create: `/opt/duta-web/src/components/dashboard-shell.tsx`
- Create: `/opt/duta-web/src/app/page.tsx`
- Create: `/opt/duta-web/src/app/(dashboard)/layout.tsx`
- Create: `/opt/duta-web/src/app/(dashboard)/dashboard/page.tsx`
- Create: `/opt/duta-web/src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Install shadcn/ui components**

```bash
cd /opt/duta-web
npx shadcn@latest add button input label card badge avatar skeleton dropdown-menu sheet
```

This generates the components from shadcn/ui registry into `src/components/ui/`.

- [ ] **Step 2: Create theme toggle**

```tsx
// src/components/theme-toggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

- [ ] **Step 3: Create sidebar navigation**

```tsx
// src/components/sidebar-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, User, Megaphone, Scissors, Wallet, MessageSquare } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/clips', label: 'Clips', icon: Scissors },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Create user nav (top-right dropdown)**

```tsx
// src/components/user-nav.tsx
'use client';

import { useLogto } from '@logto/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

export function UserNav() {
  const { signOut, isAuthenticated } = useLogto();

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>DU</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(window.location.origin)}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Create dashboard shell (layout wrapper)**

```tsx
// src/components/dashboard-shell.tsx
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import type { ReactNode } from 'react';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-bold text-primary">Duta</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create dashboard layout with auth guard**

```tsx
// src/app/(dashboard)/layout.tsx
import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell } from '@/components/dashboard-shell';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
```

- [ ] **Step 7: Create landing page**

```tsx
// src/app/page.tsx
'use client';

import { useLogto } from '@logto/react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { signIn, isAuthenticated } = useLogto();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          <span className="text-primary">Duta</span> — Viralkan Kontenmu
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Platform marketplace yang mempertemukan content clipper dengan content owner
          untuk memviralkan konten melalui clipping.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <a href="/dashboard">Masuk Dashboard</a>
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => signIn(window.location.origin + '/callback')}
              >
                Mulai Sekarang
              </Button>
              <Button size="lg" variant="outline">
                Pelajari Lebih
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 8: Create dashboard and profile pages**

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Selamat datang di Duta Platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clip Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <Badge variant="secondary">IDR</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bronze</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

```tsx
// src/app/(dashboard)/profile/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  // Will use Orval-generated hooks after full integration
  // For now: static placeholder
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Kelola profil dan informasi akunmu.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" placeholder="Nama lengkap" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Ceritakan tentang dirimu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Niche Tags</Label>
            <Input id="tags" placeholder="gaming, tech, lifestyle" />
          </div>
          <Button>Simpan</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 9: Verify build**

```bash
cd /opt/duta-web
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
cd /opt/duta-web
git add .
git commit -m "feat: add dashboard shell, landing page, profile page with shadcn/ui design system"
```

---

### Task 12: Nginx Configuration for 3 Subdomains

**Files:**
- Modify: `/etc/nginx/sites-available/duta.val.id`

This task configures Nginx on the host to reverse proxy 3 subdomains to the Docker services.

- [ ] **Step 1: Update Nginx config for 3 subdomains (HTTP-only, certbot adds SSL)**

```nginx
# /etc/nginx/sites-available/duta.val.id

# Frontend: duta.val.id → Next.js :3000
server {
    listen 80;
    server_name duta.val.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API: api.duta.val.id → NestJS :3001
server {
    listen 80;
    server_name api.duta.val.id;

    client_max_body_size 5G;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support (Socket.io)
        proxy_read_timeout 86400;
    }
}

# Auth: auth.duta.val.id → Logto :3302
server {
    listen 80;
    server_name auth.duta.val.id;

    location / {
        proxy_pass http://127.0.0.1:3302;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] **Step 2: Test Nginx config**

```bash
sudo nginx -t
```

Expected: `syntax is ok`, `test is successful`.

- [ ] **Step 3: Reload Nginx**

```bash
sudo systemctl reload nginx
```

- [ ] **Step 4: Run certbot for SSL (after DNS A records are set)**

```bash
sudo certbot --nginx -d duta.val.id -d api.duta.val.id -d auth.duta.val.id
```

Expected: SSL certificates obtained and Nginx config auto-updated with SSL blocks.

- [ ] **Step 5: Verify certbot auto-renewal cron**

```bash
sudo certbot renew --dry-run
```

Expected: Renewal dry-run succeeds.

---

### Task 13: Preserve Docs & Wire Everything Together

**Files:**
- Move: `/opt/duta/docs/` → `/opt/duta-api/docs/`
- Clean up: obsolete monorepo files

This task moves the design docs to the API repo (as the "primary" repo) and ensures both repos can be started together.

- [ ] **Step 1: Move docs to duta-api**

```bash
cp -r /opt/duta/docs /opt/duta-api/docs
```

- [ ] **Step 2: Create a startup convenience script**

```bash
# /opt/duta-api/scripts/dev.sh
#!/bin/bash
# Start all infrastructure + API in dev mode
set -e

echo "Starting Docker infrastructure..."
docker compose up -d postgres redis typesense logto prometheus grafana

echo "Waiting for services to be healthy..."
sleep 5

echo "Running Prisma migrations..."
pnpm prisma migrate deploy

echo "Starting API in watch mode..."
pnpm dev
```

```bash
chmod +x /opt/duta-api/scripts/dev.sh
```

- [ ] **Step 3: Update duta-api .env with Docker-external URLs**

When running `pnpm dev` outside Docker (local dev), the API connects to Docker-exposed ports:

```bash
# .env (local dev — API runs outside Docker, infra inside Docker)
DATABASE_URL="postgresql://duta:duta_secret@localhost:5432/duta?schema=public"
REDIS_URL="redis://localhost:6379"
LOGTO_ENDPOINT="http://localhost:3302"
LOGTO_AUDIENCE="https://api.duta.val.id"
LOGTO_JWKS_URI="http://localhost:3302/oidc/jwks"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

- [ ] **Step 4: Commit docs and scripts**

```bash
cd /opt/duta-api
git add .
git commit -m "chore: add docs, dev startup script, and local .env configuration"
```

- [ ] **Step 5: Verify full startup sequence**

```bash
cd /opt/duta-api
docker compose up -d postgres redis typesense
sleep 5
pnpm prisma migrate deploy
pnpm dev &
sleep 3
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

```bash
cd /opt/duta-web
pnpm dev &
sleep 3
curl http://localhost:3000
```

Expected: HTML response from Next.js.

- [ ] **Step 6: Kill dev servers**

```bash
kill %1 %2 2>/dev/null; docker compose -f /opt/duta-api/docker-compose.yml down
```

---

## Summary

| Task | What It Builds | Repo |
|------|---------------|------|
| 1 | NestJS project skeleton (package.json, tsconfig, lint) | duta-api |
| 2 | Docker Compose (PostgreSQL, Redis, Typesense, Logto, Prometheus, Grafana) | duta-api |
| 3 | Prisma schema (all models) + first migration | duta-api |
| 4 | NestJS DDD foundation (config, Prisma, Redis, exception filter, Swagger) | duta-api |
| 5 | OpenAPI auto-generation script + health endpoint | duta-api |
| 6 | Logto JWT auth guard (JWKS verification) | duta-api |
| 7 | User domain entity + profile endpoints (GET/PATCH /users/me) | duta-api |
| 8 | Next.js 15 project skeleton (Tailwind v4, OKLCH, shadcn/ui) | duta-web |
| 9 | Orval config (OpenAPI → TanStack Query hooks) | duta-web |
| 10 | Logto auth (React SDK, callback, auth guard, token injection) | duta-web |
| 11 | Dashboard shell, landing page, profile page, design system | duta-web |
| 12 | Nginx reverse proxy for 3 subdomains + SSL | host |
| 13 | Move docs, wire repos together, verify full startup | both |

**After this plan:** Both repos are running, authenticated users can log in via Logto, view their profile via OpenAPI-generated hooks, and the full Docker infrastructure is operational. Ready for **Phase 1: Core Marketplace**.
