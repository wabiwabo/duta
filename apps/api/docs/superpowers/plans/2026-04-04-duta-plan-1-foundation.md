# Duta Platform — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the monorepo, database schema, authentication system, user profiles, and UI design system — producing a working app where users can register, log in, and manage their profiles as content owners or clippers.

**Architecture:** Turborepo monorepo with two apps (`web` = Next.js 15 frontend, `api` = NestJS backend) and shared packages (`db` = Prisma schema, `shared` = types/validators). The API uses JWT auth with refresh tokens. PostgreSQL via Neon, Redis via Upstash for sessions/cache.

**Tech Stack:** Next.js 15 (App Router), NestJS, TypeScript, Prisma, PostgreSQL (Neon), Redis (Upstash), Tailwind CSS, shadcn/ui, Turborepo, pnpm

**Spec reference:** `docs/superpowers/specs/2026-04-04-duta-platform-design.md` — Sections 9.1-9.3 (Tech Stack, Architecture, Data Model), 6.3 (User Roles), 7.6 F17 (Authentication), 7.2 F7 (Clipper Profile)

**Plans overview:** This is Plan 1 of 6. After completion:
- Plan 2: Core Marketplace (campaigns, clips, discovery)
- Plan 3: Trust Layer (payments, escrow, disputes)
- Plan 4: Podcast Pipeline (RSS, transcription, audio-to-video)
- Plan 5: Intelligence & Polish (scoring, matching, messaging, admin)
- Plan 6: Testing & Launch (E2E, security, performance)

---

## File Structure

```
duta/
├── turbo.json                          # Turborepo pipeline config
├── package.json                        # Root workspace config
├── pnpm-workspace.yaml                 # pnpm workspace definition
├── .env.example                        # Environment variable template
├── .gitignore                          # Git ignore rules
├── apps/
│   ├── web/                            # Next.js 15 frontend
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx          # Root layout with providers
│   │   │   │   ├── page.tsx            # Landing page
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── verify-email/page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx      # Authenticated layout with sidebar
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   └── profile/page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts       # Fetch wrapper for API calls
│   │   │   │   └── auth.ts             # Auth helpers (token storage, refresh)
│   │   │   └── components/
│   │   │       ├── ui/                 # shadcn/ui components (auto-generated)
│   │   │       ├── auth-form.tsx       # Login/register form component
│   │   │       ├── profile-form.tsx    # Profile edit form
│   │   │       └── dashboard-shell.tsx # Dashboard layout shell
│   │   └── components.json            # shadcn/ui config
│   └── api/                            # NestJS backend
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── nest-cli.json
│       ├── src/
│       │   ├── main.ts                 # NestJS bootstrap
│       │   ├── app.module.ts           # Root module
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts  # POST /auth/register, /auth/login, /auth/refresh
│       │   │   ├── auth.service.ts     # Register, login, token generation
│       │   │   ├── jwt.strategy.ts     # Passport JWT strategy
│       │   │   ├── jwt-auth.guard.ts   # Route protection guard
│       │   │   └── auth.controller.spec.ts
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.controller.ts # GET /users/me, PATCH /users/me
│       │   │   ├── users.service.ts    # Profile CRUD
│       │   │   └── users.controller.spec.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts   # Prisma client provider
│       │   └── common/
│       │       ├── decorators/
│       │       │   └── current-user.decorator.ts  # @CurrentUser() param decorator
│       │       └── dto/
│       │           └── api-response.dto.ts        # Standard response envelope
│       └── test/
│           ├── jest-e2e.json
│           └── auth.e2e-spec.ts        # Auth flow integration test
└── packages/
    ├── db/                             # Prisma schema package
    │   ├── package.json
    │   ├── prisma/
    │   │   ├── schema.prisma           # Full database schema
    │   │   └── seed.ts                 # Seed script for dev data
    │   └── index.ts                    # Re-exports PrismaClient
    └── shared/                         # Shared types & validators
        ├── package.json
        ├── src/
        │   ├── types.ts                # UserRole, CampaignType, ClipStatus enums
        │   └── validators.ts           # Zod schemas for register, login, profile
        └── index.ts
```

---

### Task 1: Initialize Monorepo

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Initialize git repo**

```bash
cd /opt/duta
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "duta",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "db:generate": "pnpm --filter @duta/db generate",
    "db:push": "pnpm --filter @duta/db push",
    "db:seed": "pnpm --filter @duta/db seed"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.next/
.env
.env.local
*.local.md
.turbo/
coverage/
.superpowers/
```

- [ ] **Step 6: Create .env.example**

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/duta?sslmode=require"

# Auth
JWT_SECRET="change-me-to-random-64-char-string"
JWT_REFRESH_SECRET="change-me-to-different-random-64-char-string"

# Redis
REDIS_URL="redis://localhost:6379"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="duta-uploads"

# Xendit (Payment)
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""

# OpenAI (Whisper)
OPENAI_API_KEY=""

# App
API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

- [ ] **Step 7: Install dependencies and verify**

```bash
pnpm install
```

Expected: lockfile generated, turbo installed.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize turborepo monorepo with pnpm workspaces"
```

---

### Task 2: Create Shared Types Package

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/types.ts`, `packages/shared/src/validators.ts`, `packages/shared/index.ts`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@duta/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*", "index.ts"]
}
```

- [ ] **Step 3: Create packages/shared/src/types.ts**

These enums and types mirror the data model in the spec (Section 9.3).

```typescript
export enum UserRole {
  OWNER = "owner",
  CLIPPER = "clipper",
  ADMIN = "admin",
}

export enum KycStatus {
  NONE = "none",
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum CampaignType {
  BOUNTY = "bounty",
  GIG = "gig",
  PODCAST = "podcast",
}

export enum CampaignStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

export enum ClipStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REVISION = "revision",
  REJECTED = "rejected",
}

export enum TransactionType {
  DEPOSIT = "deposit",
  PAYOUT = "payout",
  REFUND = "refund",
  FEE = "fee",
}

export enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum DisputeStatus {
  OPEN = "open",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
}

export enum ClipperTier {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
}

export enum TargetPlatform {
  TIKTOK = "tiktok",
  REELS = "reels",
  SHORTS = "shorts",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

- [ ] **Step 4: Create packages/shared/src/validators.ts**

Zod schemas for input validation — used by both frontend forms and backend DTOs.

```typescript
import { z } from "zod";
import { UserRole } from "./types";

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  role: z.enum([UserRole.OWNER, UserRole.CLIPPER]),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  nicheTags: z.array(z.string().max(30)).max(10).optional(),
  socialLinks: z
    .object({
      youtube: z.string().url().optional().nullable(),
      tiktok: z.string().url().optional().nullable(),
      instagram: z.string().url().optional().nullable(),
      twitter: z.string().url().optional().nullable(),
      podcast: z.string().url().optional().nullable(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

- [ ] **Step 5: Create packages/shared/index.ts**

```typescript
export * from "./src/types";
export * from "./src/validators";
```

- [ ] **Step 6: Install shared deps and verify**

```bash
cd /opt/duta
pnpm install
pnpm --filter @duta/shared lint
```

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared types and zod validators package"
```

---

### Task 3: Create Database Schema Package

**Files:**
- Create: `packages/db/package.json`, `packages/db/prisma/schema.prisma`, `packages/db/index.ts`, `packages/db/prisma/seed.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@duta/db",
  "version": "0.0.1",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "generate": "prisma generate",
    "push": "prisma db push",
    "seed": "tsx prisma/seed.ts",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.3.0"
  },
  "devDependencies": {
    "prisma": "^6.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create packages/db/prisma/schema.prisma**

Full schema matching spec Section 9.3. All entities included now so migrations are clean.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  role          UserRole
  bio           String?
  avatarUrl     String?   @map("avatar_url")
  nicheTags     String[]  @default([]) @map("niche_tags")
  socialLinks   Json?     @map("social_links")
  kycStatus     KycStatus @default(none) @map("kyc_status")
  kycDocumentUrl String?  @map("kyc_document_url")
  clipperScore  Int       @default(0) @map("clipper_score")
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  campaigns        Campaign[]
  clips            Clip[]
  transactionsFrom Transaction[] @relation("TransactionFrom")
  transactionsTo   Transaction[] @relation("TransactionTo")
  sentMessages     Message[]     @relation("MessageSender")
  reviewsGiven     Review[]      @relation("ReviewerRel")
  reviewsReceived  Review[]      @relation("RevieweeRel")
  disputesRaised   Dispute[]     @relation("DisputeRaiser")
  disputesAgainst  Dispute[]     @relation("DisputeTarget")
  disputesResolved Dispute[]     @relation("DisputeResolver")

  @@map("users")
}

model Campaign {
  id              String         @id @default(cuid())
  ownerId         String         @map("owner_id")
  type            CampaignType
  title           String
  description     String
  guidelines      String?
  sourceType      String?        @map("source_type") // "youtube_url", "upload_video", "upload_audio", "rss"
  sourceUrl       String?        @map("source_url")
  sourceFileKey   String?        @map("source_file_key")
  sourceMetadata  Json?          @map("source_metadata")
  ratePerKViews   Int?           @map("rate_per_k_views") // in IDR, for bounty type
  budgetTotal     Int            @map("budget_total") // in IDR
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

  @@index([ownerId])
  @@index([status])
  @@index([type])
  @@map("campaigns")
}

model Clip {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  clipperId       String    @map("clipper_id")
  fileKey         String?   @map("file_key")
  postedUrl       String?   @map("posted_url")
  platform        String?
  status          ClipStatus @default(submitted)
  reviewFeedback  String?   @map("review_feedback")
  viewsVerified   Int       @default(0) @map("views_verified")
  earningsAmount  Int       @default(0) @map("earnings_amount") // in IDR
  submittedAt     DateTime  @default(now()) @map("submitted_at")
  reviewedAt      DateTime? @map("reviewed_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  campaign        Campaign  @relation(fields: [campaignId], references: [id])
  clipper         User      @relation(fields: [clipperId], references: [id])
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
  status         String   @default("active") // active, depleted, refunded
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
  amount           Int               // in IDR
  currency         String            @default("IDR")
  status           TransactionStatus @default(pending)
  paymentMethod    String?           @map("payment_method")
  paymentReference String?           @map("payment_reference")
  createdAt        DateTime          @default(now()) @map("created_at")

  fromUser         User?    @relation("TransactionFrom", fields: [fromUserId], references: [id])
  toUser           User?    @relation("TransactionTo", fields: [toUserId], references: [id])
  campaign         Campaign? @relation(fields: [campaignId], references: [id])
  clip             Clip?    @relation(fields: [clipId], references: [id])

  @@index([fromUserId])
  @@index([toUserId])
  @@index([campaignId])
  @@map("transactions")
}

model PodcastEpisode {
  id                String   @id @default(cuid())
  campaignId        String   @map("campaign_id")
  title             String
  description       String?
  audioUrl          String?  @map("audio_url")
  audioFileKey      String?  @map("audio_file_key")
  transcriptText    String?  @map("transcript_text")
  transcriptSegments Json?   @map("transcript_segments") // [{start, end, text}]
  suggestedMoments  Json?    @map("suggested_moments") // [{start, end, label}]
  duration          Int?     // in seconds
  createdAt         DateTime @default(now()) @map("created_at")

  campaign          Campaign @relation(fields: [campaignId], references: [id])

  @@index([campaignId])
  @@map("podcast_episodes")
}

model Conversation {
  id          String    @id @default(cuid())
  campaignId  String?   @map("campaign_id")
  type        String    @default("direct") // "direct" or "campaign_group"
  createdAt   DateTime  @default(now()) @map("created_at")

  messages    Message[]
  participants ConversationParticipant[]

  @@map("conversations")
}

model ConversationParticipant {
  id             String   @id @default(cuid())
  conversationId String   @map("conversation_id")
  userId         String   @map("user_id")
  joinedAt       DateTime @default(now()) @map("joined_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id])

  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String   @map("conversation_id")
  senderId       String   @map("sender_id")
  content        String
  attachments    Json?    // [{type, url, name}]
  readAt         DateTime? @map("read_at")
  createdAt      DateTime @default(now()) @map("created_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation("MessageSender", fields: [senderId], references: [id])

  @@index([conversationId])
  @@map("messages")
}

model Review {
  id          String   @id @default(cuid())
  reviewerId  String   @map("reviewer_id")
  revieweeId  String   @map("reviewee_id")
  campaignId  String?  @map("campaign_id")
  clipId      String?  @map("clip_id")
  rating      Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now()) @map("created_at")

  reviewer    User     @relation("ReviewerRel", fields: [reviewerId], references: [id])
  reviewee    User     @relation("RevieweeRel", fields: [revieweeId], references: [id])
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  clip        Clip?    @relation(fields: [clipId], references: [id])

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
  evidence     Json?         // [{type, url, description}]
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
```

- [ ] **Step 3: Create packages/db/index.ts**

```typescript
export { PrismaClient } from "@prisma/client";
export type * from "@prisma/client";
```

- [ ] **Step 4: Create packages/db/prisma/seed.ts**

```typescript
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "andi@example.com" },
    update: {},
    create: {
      email: "andi@example.com",
      passwordHash,
      name: "Andi Tech Review",
      role: "owner",
      bio: "Tech YouTuber 50K subs",
      nicheTags: ["tech", "review", "gadget"],
      emailVerified: true,
    },
  });

  const clipper = await prisma.user.upsert({
    where: { email: "rina@example.com" },
    update: {},
    create: {
      email: "rina@example.com",
      passwordHash,
      name: "Rina Clipper",
      role: "clipper",
      bio: "CapCut & Premiere Pro editor",
      nicheTags: ["tech", "gaming", "lifestyle"],
      kycStatus: "verified",
      clipperScore: 72,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@duta.id" },
    update: {},
    create: {
      email: "admin@duta.id",
      passwordHash,
      name: "Duta Admin",
      role: "admin",
      emailVerified: true,
    },
  });

  console.log("Seeded users:", { owner: owner.id, clipper: clipper.id, admin: admin.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 5: Install deps and generate Prisma client**

```bash
cd /opt/duta
pnpm install
pnpm db:generate
```

Expected: Prisma client generated successfully.

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat: add database schema package with full Prisma schema"
```

---

### Task 4: Set Up NestJS API App

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`, `apps/api/nest-cli.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/common/dto/api-response.dto.ts`, `apps/api/src/common/decorators/current-user.decorator.ts`

- [ ] **Step 1: Create apps/api/package.json**

```json
{
  "name": "@duta/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@duta/db": "workspace:*",
    "@duta/shared": "workspace:*",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jest": "^29.5.0",
    "@types/passport-jwt": "^4.0.1",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
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
      "^@duta/shared$": "<rootDir>/../../packages/shared/index.ts",
      "^@duta/db$": "<rootDir>/../../packages/db/index.ts"
    }
  }
}
```

- [ ] **Step 2: Create apps/api/tsconfig.json**

```json
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
      "@duta/shared": ["../../packages/shared/index.ts"],
      "@duta/db": ["../../packages/db/index.ts"]
    }
  }
}
```

- [ ] **Step 3: Create apps/api/tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create apps/api/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.build.json"
  }
}
```

- [ ] **Step 5: Create apps/api/src/prisma/prisma.service.ts**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@duta/db";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 6: Create apps/api/src/prisma/prisma.module.ts**

```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 7: Create apps/api/src/common/dto/api-response.dto.ts**

```typescript
export class ApiResponseDto<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    const res = new ApiResponseDto<T>();
    res.success = true;
    res.data = data;
    res.message = message;
    return res;
  }

  static fail(error: string): ApiResponseDto {
    const res = new ApiResponseDto();
    res.success = false;
    res.error = error;
    return res;
  }
}
```

- [ ] **Step 8: Create apps/api/src/common/decorators/current-user.decorator.ts**

```typescript
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user[data] : user;
  },
);
```

- [ ] **Step 9: Create apps/api/src/app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

- [ ] **Step 10: Create apps/api/src/main.ts**

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Duta API running on http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 11: Install deps and verify compilation**

```bash
cd /opt/duta
pnpm install
pnpm --filter @duta/api build
```

Expected: Build succeeds, `dist/` created.

- [ ] **Step 12: Commit**

```bash
git add apps/api
git commit -m "feat: set up NestJS API app with Prisma module and common utilities"
```

---

### Task 5: Implement Authentication — Register & Login

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/jwt.strategy.ts`, `apps/api/src/auth/jwt-auth.guard.ts`
- Modify: `apps/api/src/app.module.ts` (add AuthModule import)

- [ ] **Step 1: Write the failing test — apps/api/src/auth/auth.controller.spec.ts**

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mock-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "clipper",
      });

      const result = await controller.register({
        email: "test@example.com",
        password: "securepass123",
        name: "Test User",
        role: "clipper" as const,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("accessToken");
      expect(result.data).toHaveProperty("refreshToken");
      expect(result.data?.user.email).toBe("test@example.com");
    });

    it("should throw ConflictException if email exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        controller.register({
          email: "taken@example.com",
          password: "securepass123",
          name: "Test",
          role: "clipper" as const,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("POST /auth/login", () => {
    it("should return tokens for valid credentials", async () => {
      // bcryptjs hash of "securepass123" with 12 rounds
      const { hash } = await import("bcryptjs");
      const passwordHash = await hash("securepass123", 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash,
        name: "Test User",
        role: "clipper",
      });

      const result = await controller.login({
        email: "test@example.com",
        password: "securepass123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("accessToken");
    });

    it("should throw UnauthorizedException for wrong password", async () => {
      const { hash } = await import("bcryptjs");
      const passwordHash = await hash("correctpass", 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash,
      });

      await expect(
        controller.login({
          email: "test@example.com",
          password: "wrongpass",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.login({
          email: "nobody@example.com",
          password: "whatever",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @duta/api test -- --testPathPattern=auth.controller.spec
```

Expected: FAIL — AuthController, AuthService not found.

- [ ] **Step 3: Create apps/api/src/auth/auth.service.ts**

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterInput, LoginInput } from "@duta/shared";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Email sudah terdaftar");
    }

    const passwordHash = await hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user, ...tokens };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException("Email atau password salah");
    }

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Email atau password salah");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(userId: string, email: string, role: string) {
    return this.generateTokens(userId, email, role);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: "15m",
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 4: Create apps/api/src/auth/auth.controller.ts**

```typescript
import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { registerSchema, loginSchema } from "@duta/shared";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import type { RegisterInput, LoginInput } from "@duta/shared";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() body: RegisterInput) {
    const input = registerSchema.parse(body);
    const result = await this.authService.register(input);
    return ApiResponseDto.ok(result, "Registrasi berhasil");
  }

  @Post("login")
  async login(@Body() body: LoginInput) {
    const input = loginSchema.parse(body);
    const result = await this.authService.login(input);
    return ApiResponseDto.ok(result, "Login berhasil");
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: JwtPayload) {
    const tokens = await this.authService.refreshToken(
      user.sub,
      user.email,
      user.role,
    );
    return ApiResponseDto.ok(tokens);
  }
}
```

- [ ] **Step 5: Create apps/api/src/auth/jwt.strategy.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev-secret-change-me",
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
```

- [ ] **Step 6: Create apps/api/src/auth/jwt-auth.guard.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

- [ ] **Step 7: Create apps/api/src/auth/auth.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 8: Update apps/api/src/app.module.ts to import AuthModule**

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
})
export class AppModule {}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pnpm --filter @duta/api test -- --testPathPattern=auth.controller.spec
```

Expected: All 4 tests PASS.

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts
git commit -m "feat: implement auth module with register, login, and JWT refresh"
```

---

### Task 6: Implement User Profile — GET & PATCH /users/me

**Files:**
- Create: `apps/api/src/users/users.module.ts`, `apps/api/src/users/users.service.ts`, `apps/api/src/users/users.controller.ts`, `apps/api/src/users/users.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts` (add UsersModule import)

- [ ] **Step 1: Write the failing test — apps/api/src/users/users.controller.spec.ts**

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("UsersController", () => {
  let controller: UsersController;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "clipper",
    bio: null,
    avatarUrl: null,
    nicheTags: ["tech"],
    socialLinks: null,
    kycStatus: "none",
    clipperScore: 0,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe("GET /users/me", () => {
    it("should return the current user profile", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getMe({
        sub: "user-1",
        email: "test@example.com",
        role: "clipper",
      });

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("test@example.com");
      expect(result.data).not.toHaveProperty("passwordHash");
    });

    it("should throw NotFoundException if user deleted", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.getMe({ sub: "gone", email: "x", role: "clipper" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("PATCH /users/me", () => {
    it("should update profile fields", async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        bio: "Updated bio",
      });

      const result = await controller.updateMe(
        { sub: "user-1", email: "test@example.com", role: "clipper" },
        { bio: "Updated bio" },
      );

      expect(result.success).toBe(true);
      expect(result.data?.bio).toBe("Updated bio");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { bio: "Updated bio" },
        select: expect.any(Object),
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @duta/api test -- --testPathPattern=users.controller.spec
```

Expected: FAIL — UsersController, UsersService not found.

- [ ] **Step 3: Create apps/api/src/users/users.service.ts**

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateProfileInput } from "@duta/shared";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  bio: true,
  avatarUrl: true,
  nicheTags: true,
  socialLinks: true,
  kycStatus: true,
  clipperScore: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException("User tidak ditemukan");
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.nicheTags !== undefined) data.nicheTags = input.nicheTags;
    if (input.socialLinks !== undefined) data.socialLinks = input.socialLinks;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });
  }
}
```

- [ ] **Step 4: Create apps/api/src/users/users.controller.ts**

```typescript
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { updateProfileSchema } from "@duta/shared";
import type { UpdateProfileInput } from "@duta/shared";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getById(user.sub);
    return ApiResponseDto.ok(profile);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateProfileInput,
  ) {
    const input = updateProfileSchema.parse(body);
    const updated = await this.usersService.updateProfile(user.sub, input);
    return ApiResponseDto.ok(updated, "Profil berhasil diperbarui");
  }
}
```

- [ ] **Step 5: Create apps/api/src/users/users.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 6: Update apps/api/src/app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pnpm --filter @duta/api test
```

Expected: All auth + user tests PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/users apps/api/src/app.module.ts
git commit -m "feat: implement user profile endpoints GET/PATCH /users/me"
```

---

### Task 7: Set Up Next.js Frontend App

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/tsconfig.json`, `apps/web/components.json`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/auth.ts`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@duta/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@duta/shared": "workspace:*",
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.469.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@duta/shared"],
};

export default nextConfig;
```

- [ ] **Step 3: Create apps/web/tsconfig.json**

```json
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
      "@/*": ["./src/*"],
      "@duta/shared": ["../../packages/shared/index.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create apps/web/tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create apps/web/src/app/globals.css**

```css
@import "tailwindcss";
```

- [ ] **Step 6: Create apps/web/src/lib/api-client.ts**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    headers,
    ...rest,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `API error: ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 7: Create apps/web/src/lib/auth.ts**

Client-side token management. Stores tokens in localStorage (acceptable for MVP — HttpOnly cookies in Phase 2).

```typescript
const ACCESS_TOKEN_KEY = "duta_access_token";
const REFRESH_TOKEN_KEY = "duta_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}
```

- [ ] **Step 8: Create apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duta — Viralkan Kontenmu",
  description:
    "Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Create apps/web/src/app/page.tsx**

Simple landing page placeholder.

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">Duta</h1>
      <p className="mt-2 text-lg text-gray-600">Viralkan Kontenmu</p>
      <p className="mt-4 max-w-md text-center text-gray-500">
        Platform marketplace yang mempertemukan content clipper dengan content
        owner untuk memviralkan konten melalui clipping.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/register"
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          Daftar Sekarang
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Masuk
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Install deps and verify build**

```bash
cd /opt/duta
pnpm install
pnpm --filter @duta/web build
```

Expected: Next.js build succeeds.

- [ ] **Step 11: Commit**

```bash
git add apps/web
git commit -m "feat: set up Next.js 15 frontend with Tailwind, API client, and landing page"
```

---

### Task 8: Build Auth Pages — Register & Login

**Files:**
- Create: `apps/web/src/components/auth-form.tsx`, `apps/web/src/app/(auth)/register/page.tsx`, `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create apps/web/src/components/auth-form.tsx**

Shared form component used by both register and login pages.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import type { ApiResponse } from "@duta/shared";

interface AuthFormProps {
  mode: "login" | "register";
}

interface AuthResponse {
  user: { id: string; email: string; name: string; role: string };
  accessToken: string;
  refreshToken: string;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    if (isRegister) {
      body.name = form.get("name") as string;
      body.role = form.get("role") as string;
    }

    try {
      const res = await apiClient<ApiResponse<AuthResponse>>(
        `/auth/${mode}`,
        { method: "POST", body: JSON.stringify(body) },
      );

      if (res.success && res.data) {
        setTokens(res.data.accessToken, res.data.refreshToken);
        router.push("/dashboard");
      } else {
        setError(res.error || "Terjadi kesalahan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nama
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {isRegister && (
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Saya adalah
          </label>
          <select
            id="role"
            name="role"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="owner">Content Owner (Kreator/Podcaster)</option>
            <option value="clipper">Clipper (Editor)</option>
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
      </button>

      <p className="text-center text-sm text-gray-500">
        {isRegister ? (
          <>Sudah punya akun? <Link href="/login" className="text-brand-600 hover:underline">Masuk</Link></>
        ) : (
          <>Belum punya akun? <Link href="/register" className="text-brand-600 hover:underline">Daftar</Link></>
        )}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/(auth)/register/page.tsx**

```tsx
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Daftar di Duta</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Mulai viralkan kontenmu hari ini
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create apps/web/src/app/(auth)/login/page.tsx**

```tsx
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Masuk ke Duta</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Selamat datang kembali
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm --filter @duta/web build
```

Expected: Build succeeds with `/register` and `/login` routes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "feat: add auth pages with register and login forms"
```

---

### Task 9: Build Dashboard Shell & Profile Page

**Files:**
- Create: `apps/web/src/components/dashboard-shell.tsx`, `apps/web/src/app/(dashboard)/layout.tsx`, `apps/web/src/app/(dashboard)/dashboard/page.tsx`, `apps/web/src/components/profile-form.tsx`, `apps/web/src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Create apps/web/src/components/dashboard-shell.tsx**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profil" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
        <Link href="/dashboard" className="text-xl font-bold text-brand-600">
          Duta
        </Link>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 text-sm text-gray-500 hover:text-red-600"
        >
          Keluar
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/(dashboard)/layout.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

- [ ] **Step 3: Create apps/web/src/app/(dashboard)/dashboard/page.tsx**

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Selamat datang di Duta. Fitur campaign dan clipping akan tersedia di
        Plan 2.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/components/profile-form.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ApiResponse } from "@duta/shared";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  nicheTags: string[];
  socialLinks: Record<string, string | null> | null;
  kycStatus: string;
  clipperScore: number;
}

export function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = getAccessToken();
        const res = await apiClient<ApiResponse<UserProfile>>("/users/me", {
          token: token || undefined,
        });
        if (res.success && res.data) setProfile(res.data);
      } catch {
        setMessage("Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      bio: (form.get("bio") as string) || undefined,
      nicheTags: (form.get("nicheTags") as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const token = getAccessToken();
      const res = await apiClient<ApiResponse<UserProfile>>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
        token: token || undefined,
      });
      if (res.success && res.data) {
        setProfile(res.data);
        setMessage("Profil berhasil diperbarui");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Memuat profil...</p>;
  if (!profile) return <p className="text-red-500">Gagal memuat profil</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <p className="mt-1 text-sm text-gray-500 capitalize">{profile.role}</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nama
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={profile.name}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio || ""}
          maxLength={500}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="nicheTags" className="block text-sm font-medium text-gray-700">
          Niche Tags (pisahkan dengan koma)
        </label>
        <input
          id="nicheTags"
          name="nicheTags"
          type="text"
          defaultValue={profile.nicheTags.join(", ")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {profile.role === "clipper" && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Clipper Score</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">
            {profile.clipperScore}
          </p>
          <p className="text-xs text-gray-500">
            KYC Status: <span className="capitalize">{profile.kycStatus}</span>
          </p>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.includes("berhasil") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Profil"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Create apps/web/src/app/(dashboard)/profile/page.tsx**

```tsx
import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profil Saya</h1>
      <p className="mt-1 text-sm text-gray-500">
        Kelola informasi profil dan preferensi akun
      </p>
      <div className="mt-6">
        <ProfileForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
pnpm --filter @duta/web build
```

Expected: Build succeeds with `/dashboard` and `/profile` routes.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -m "feat: add dashboard shell, profile page with edit form"
```

---

### Task 10: Add shadcn/ui & Initialize Design System

**Files:**
- Create: `apps/web/components.json`, `apps/web/src/lib/utils.ts`

- [ ] **Step 1: Create apps/web/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create apps/web/components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "blue",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Install shadcn/ui core components**

```bash
cd /opt/duta/apps/web
npx shadcn@latest add button input label card badge --yes
```

Expected: Components created in `src/components/ui/`.

- [ ] **Step 4: Verify build**

```bash
cd /opt/duta
pnpm --filter @duta/web build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: initialize shadcn/ui design system with core components"
```

---

### Task 11: CI/CD — GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Build packages
        run: pnpm build

      - name: Run tests
        run: pnpm test
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: add GitHub Actions workflow for lint and test"
```

---

### Task 12: Verify Full Stack End-to-End

**Files:** None new — this task runs the existing code to verify everything works together.

- [ ] **Step 1: Push database schema** (requires DATABASE_URL in .env)

```bash
cp .env.example .env
# Edit .env with actual Neon database URL, then:
pnpm db:push
```

Expected: All tables created in PostgreSQL.

- [ ] **Step 2: Seed database**

```bash
pnpm db:seed
```

Expected: "Seeded users: { owner: ..., clipper: ..., admin: ... }"

- [ ] **Step 3: Start API in one terminal**

```bash
pnpm --filter @duta/api dev
```

Expected: "Duta API running on http://localhost:3001"

- [ ] **Step 4: Test register endpoint**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"testpass123","name":"New User","role":"clipper"}'
```

Expected: `{"success":true,"data":{"user":{...},"accessToken":"...","refreshToken":"..."}}`

- [ ] **Step 5: Test login endpoint**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rina@example.com","password":"password123"}'
```

Expected: `{"success":true,"data":{"user":{...},"accessToken":"...","refreshToken":"..."}}`

- [ ] **Step 6: Test protected profile endpoint**

Use the accessToken from step 5:

```bash
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected: `{"success":true,"data":{"id":"...","email":"rina@example.com","name":"Rina Clipper",...}}`

- [ ] **Step 7: Start frontend in another terminal**

```bash
pnpm --filter @duta/web dev
```

Expected: Next.js dev server on http://localhost:3000

- [ ] **Step 8: Verify in browser**

1. Open http://localhost:3000 — landing page with Daftar/Masuk buttons
2. Click "Daftar" — register form appears
3. Fill in and submit — redirects to /dashboard
4. Click "Profil" — profile loads with user data
5. Edit name, add bio — saves successfully

- [ ] **Step 9: Run all tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "chore: verify full stack foundation — auth, profiles, and frontend working"
```

---

## Plan Summary

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 1 | Initialize Monorepo | 10 min |
| 2 | Shared Types Package | 10 min |
| 3 | Database Schema Package | 15 min |
| 4 | NestJS API App Setup | 15 min |
| 5 | Auth — Register & Login | 20 min |
| 6 | User Profile Endpoints | 15 min |
| 7 | Next.js Frontend Setup | 15 min |
| 8 | Auth Pages (Register/Login) | 15 min |
| 9 | Dashboard Shell & Profile | 15 min |
| 10 | shadcn/ui Design System | 10 min |
| 11 | CI/CD GitHub Actions | 5 min |
| 12 | Full Stack Verification | 15 min |
| **Total** | | **~2.5 hours** |

## What This Produces

After completing Plan 1, you have:
- A working monorepo with frontend + backend + shared packages
- User registration and login with JWT tokens
- Profile management (view + edit)
- Database schema for ALL entities (ready for Plan 2)
- CI/CD pipeline
- shadcn/ui design system initialized

## Next Plan

**Plan 2: Core Marketplace** covers:
- Campaign CRUD (bounty + gig types)
- Source content upload to Cloudflare R2
- YouTube URL import
- Clip submission and review workflow
- Campaign discovery with Meilisearch
- Creator and clipper dashboards
