# Duta Platform — Complete Design Document v2

**Tanggal:** 5 April 2026
**Status:** Draft v2 (Major revision — incorporates all research sessions)
**Supersedes:** `2026-04-04-duta-platform-design.md`

---

# PART 1 — RESEARCH & STRATEGY

---

## 1. Executive Summary

Duta adalah platform marketplace yang mempertemukan **content clipper** dengan **content owner** (YouTuber, podcaster, brand) untuk memviralkan konten melalui clipping.

### Why Now

- Creator economy: **$254.4B** (2025), proyeksi **$2.08T** di 2035 (CAGR 23.4%)
- Short-form video market: **$34.79B** (2024) → **$289.52B** (2032, CAGR 30.3%)
- Brand spending >$100M untuk clipping di 2025
- Indonesia = TikTok #1 (125-130M users), YouTube #2 (140M users)
- 207M+ kreator global, 10-20% butuh bantuan clipping
- Clipping agencies (23K+ editors di Clipping Agency, 80K+ di Clipping Culture) sudah prove market demand

### Why Duta

Platform existing (Whop, Vyro, Clipping.io) punya masalah fundamental:
1. **Payment trust crisis** — clipper tidak dibayar saat budget habis, dispute tidak dimediasi
2. **Transactional only** — tidak ada career progression atau relationship building
3. **Quality control minim** — oversaturasi clip berkualitas rendah
4. **Podcast clipping terabaikan** — semua platform fokus video
5. **KYC & payment barrier** — sulit untuk clipper Indonesia (US-centric KYC, PayPal/crypto only)
6. **No team support** — agencies manage 23K+ editors via Discord, bukan platform

### Duta's Secret Sauce Formula

```
1. TRUST        → "Di sini, kamu pasti dibayar"
   (Escrow + KTP KYC + local payment)

2. CAREER       → "Di sini, kamu bisa naik"
   (Tier system + portfolio + relationships)

3. COMMUNITY    → "Di sini, kamu punya teman"
   (Leaderboard + niche channels + awards)

4. TOOLS        → "Di sini, kamu bisa lebih"
   (Podcast kit + AI suggestions + analytics)

5. LOCAL        → "Di sini, untuk kamu"
   (Bahasa Indonesia + GoPay + KTP)
```

**Marketplace Strategy:** "Come for the money, stay for the career"
- Whop/Vyro = ATM (ambil uang, pergi)
- Duta = Kantor (datang untuk uang, tinggal untuk karir dan komunitas)

---

## 2. Market Analysis

### 2.1 Market Size

| Metrik | Nilai | Proyeksi | CAGR | Sumber |
|--------|-------|----------|------|--------|
| Creator Economy Global | $254.4B (2025) | $2.08T (2035) | 23.4% | Precedence Research |
| Short-form Video Market | $34.79B (2024) | $289.52B (2032) | 30.3% | Business Research Insights |
| AI Dubbing Market | $31.5M (2024) | $397M (2032) | 44.4% | Industry Reports |
| SE Asia Creator Economy | $12-17B (2024) | - | - | Industry Estimates |
| Indonesia Creator Economy | $5-7B (2024) | - | - | Kemenparekraf |

### 2.2 TAM / SAM / SOM

- **TAM:** ~$50B/tahun (global content editing/repurposing)
- **SAM:** ~$5B/tahun (YouTube + Podcast clipping, Indonesia + English-speaking)
- **SOM Year 1:** 5,000 kreator + 15,000 clipper → **$3M ARR**, platform revenue **$300K-$450K**

### 2.3 Indonesia Market

- 215M+ internet users, 170M+ social media users, 98% mobile-first
- E-wallet dominant: GoPay, OVO, Dana, ShopeePay. Credit card <7%
- Gen Z freelancer: 40% motivasi = unlimited income, 25% = fleksibel, 28% = freelance
- Indonesian & Filipino editors = dominant supply-side workforce untuk English-language clipping

---

## 3. Competitive Landscape

### 3.1 Global Clipping Marketplaces

| Platform | Model | Rate | Backing | Key Weakness |
|----------|-------|------|---------|-------------|
| **Whop** | Bounty/views | $0.50-$3/1K | Market leader | Payment trust, no escrow, KYC barrier |
| **Vyro** | Bounty/views | $3/1K | MrBeast | New, unproven at scale |
| **Clipping.io** | Performance | Varies | 10K+ clippers | Less transparent |
| **ClipFarm** | Bounty | Per campaign | Airrack, HBO Max client | Whop-dependent |
| **Clipify Media** | Campaign | Per campaign | - | Limited features |

### 3.2 Indonesia Platforms

| Platform | Model | Key Weakness |
|----------|-------|-------------|
| **Clipin.id** | Kolaborasi kreator-clipper | Masih kecil, fitur basic |
| **Ternak Klip** | Marketplace klip | No escrow |
| **Trybuzzer** | Campaign berbayar | Bukan pure clipping |

### 3.3 Gap Analysis

1. **No escrow** — tidak ada platform dengan guaranteed payment + dispute mediation
2. **No career system** — semua transactional, no progression
3. **No podcast** — 0 marketplace untuk human podcast clipper
4. **No team/agency support** — agencies use Discord/Whop separately
5. **Indonesia under-served** — global platforms KYC-hostile, local platforms basic

---

## 4. Business Model

### 4.1 Revenue Streams

| Stream | Model | When |
|--------|-------|------|
| **Platform Fee** | 10% bounty, 12% gig, 8% agency | MVP |
| **Premium — Creator** | Rp 299K-999K/mo: analytics, priority matching | v1.1 |
| **Premium — Clipper** | Rp 99K-299K/mo: portfolio boost, early access | v1.1 |
| **Featured Campaigns** | Pay to appear in top results | v1.1 |
| **AI Tools Add-on** | Viral detection, auto-captions per-use | v2 |
| **Enterprise Plans** | Custom pricing for agencies | v2 |

### 4.2 Unit Economics

- Average bounty campaign: Rp 2M → platform fee Rp 200K → net Rp 150K (after Xendit 2.5%)
- Break-even: ~667 campaigns/month = ~22/day at ~2,000 active creators
- MVP infrastructure cost: $0-72/month (self-hosted)

### 4.3 Go-to-Market: Supply-First

1. **Month -2 to 0:** Recruit 500 clippers (Discord/Twitter/FB Groups, 0% fee 3 months)
2. **Month 0 to 3:** Onboard 100 mid-tier creators (direct outreach, Rp 500K subsidi)
3. **Month 3+:** Content marketing, referral, podcast niche push, brand partnerships

---

# PART 2 — TECHNICAL ARCHITECTURE

---

## 5. Architecture Overview

### 5.1 Two-Repository Architecture

Frontend dan backend sebagai **2 repo independent** yang berkomunikasi via OpenAPI contract.

```
┌────────────────────────┐          ┌────────────────────────┐
│  REPO 1: duta-api       │          │  REPO 2: duta-web       │
│  (NestJS + DDD)         │          │  (Next.js 15)           │
│                          │          │                          │
│  REST API + WebSocket    │◄────────►│  OpenAPI generated client│
│  OpenAPI spec (auto-gen) │ contract │  (Orval + TanStack Query)│
│  Background workers      │          │  Logto SDK               │
│                          │          │                          │
│  Deploy: Docker Compose  │          │  Deploy: Docker          │
│  (api+worker+infra)      │          │  (web only)              │
└────────────────────────┘          └────────────────────────┘
```

### 5.2 Communication Protocols

| Channel | Protocol | Used For |
|---------|----------|----------|
| Web → API (data) | **REST + OpenAPI 3.1** | All CRUD, queries, mutations |
| Web → API (real-time) | **Socket.io** | Chat, notifications, live counters |
| Webhooks → API | REST | Xendit, Phyllo callbacks |
| API → External | REST | Xendit, Deepgram, Phyllo, R2 |
| Worker ↔ Queue | BullMQ (Redis) | Background jobs |

### 5.3 Type-Safety: OpenAPI + Orval

```
NestJS (@nestjs/swagger decorators)
  → auto-generate openapi.json
    → Orval reads spec
      → generates TypeScript types + TanStack Query hooks
        → Frontend fully typed (zero manual types)
```

### 5.4 Subdomains

```
duta.val.id         → duta-web (Next.js :3000)
api.duta.val.id     → duta-api (NestJS :3001)
auth.duta.val.id    → Logto (:3302)
```

---

## 6. Tech Stack

### 6.1 Self-Hosted Services (Docker Compose in duta-api)

| Service | Technology | Purpose |
|---------|-----------|---------|
| **API** | NestJS (TypeScript) + DDD architecture | REST API + Socket.io gateway |
| **Worker** | NestJS Standalone + BullMQ + FFmpeg | Background jobs: video processing, transcription, payouts |
| **Database** | PostgreSQL 16 (Prisma ORM) | Primary data store |
| **Cache/Queue** | Redis 7 + BullMQ 5 | Sessions, caching, job queue with parent-child flows |
| **Search** | Typesense | Campaign & clipper search with HA clustering |
| **Auth/SSO** | Logto | Social login, email/password, MFA, customizable UI |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards, alerting |
| **Reverse Proxy** | Nginx (host-level) + Let's Encrypt | SSL termination, routing |
| **Backup** | pg_dump cron → R2 | Automated daily DB backup |

### 6.2 External Cloud APIs

| Service | Purpose | When Needed |
|---------|---------|-------------|
| **Cloudflare R2** | File storage (video, audio, images) + CDN | MVP |
| **Wasabi** | Backup storage ($6.99/TB) | Optional |
| **Xendit xenPlatform** | Payment, escrow (sub-accounts), disbursement, KYC | MVP |
| **Deepgram Nova-3** | Podcast transcription ($4.30/1K min, 99.99% SLA) | v1.1 |
| **Phyllo API** | View verification: TikTok, YouTube, Instagram | MVP |
| **Resend** | Transactional email (3K/mo free) | MVP |
| **Sentry** | Error tracking (5K events/mo free) | MVP |
| **Midtrans** | Payment fallback (Phase 2) | v2 |

### 6.3 Frontend Stack (duta-web)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 App Router + RSC | SSR/SSG, React Server Components |
| **UI System** | shadcn/ui 2026 (Registry 2.0 + custom preset) | Zero bloat, full ownership, 1300+ blocks |
| **Primitives** | Radix UI (switchable to Base UI) | Accessible, headless, composable |
| **Styling** | Tailwind CSS v4 + CVA (Class Variance Authority) | Type-safe variants |
| **Color System** | OKLCH (perceptually uniform, like Linear) | Dark-first design |
| **Animation** | Framer Motion | Page transitions, micro-interactions (200-500ms) |
| **Data Fetching** | TanStack Query (generated by Orval) | Cache, optimistic updates, infinite scroll |
| **State (client)** | Zustand | Minimal client state |
| **State (complex)** | XState | Multi-step forms, campaign wizard, clip submission flow |
| **Tables** | TanStack Table | Sort, filter, paginate, virtual scroll |
| **Charts** | Recharts | Earnings, views, performance analytics |
| **Forms** | React Hook Form + Zod | Type-safe validation, multi-step |
| **Upload** | Uppy + TUS protocol | Resumable upload, pause/resume, progress |
| **Icons** | Lucide | Consistent icon set |
| **Toast** | Sonner | Notification toasts |
| **Audio** | WaveSurfer.js | Podcast waveform visualization |
| **Rich Text** | Tiptap | Campaign brief/guidelines editor |
| **Command** | cmdk (shadcn) | Cmd+K search palette |
| **Dark Mode** | next-themes + CSS custom properties | System-aware, user-toggleable |

### 6.4 Backend Architecture (duta-api) — DDD + CQRS

```
src/
├── domain/                     # Pure business logic (no framework deps)
│   ├── campaign/
│   │   ├── entities/           # Rich domain models with behavior
│   │   ├── value-objects/      # Money, CampaignStatus (validated, immutable)
│   │   ├── events/             # CampaignCreated, ClipApproved
│   │   └── ports/              # Repository interfaces
│   ├── payment/
│   ├── user/
│   ├── podcast/
│   └── organization/           # Team/Agency
│
├── application/                # Use cases (CQRS: commands + queries)
│   ├── campaign/
│   │   ├── commands/           # CreateCampaign, ApproveClip
│   │   └── queries/            # ListCampaigns, GetCampaign
│   └── ...
│
├── infrastructure/             # Adapters (implement ports)
│   ├── persistence/            # Prisma repositories
│   ├── storage/                # R2 adapter
│   ├── payment/                # Xendit adapter
│   ├── transcription/          # Deepgram adapter
│   ├── verification/           # Phyllo adapter
│   ├── search/                 # Typesense adapter
│   └── queue/                  # BullMQ adapter
│
├── presentation/               # HTTP layer
│   ├── rest/                   # Controllers with @ApiProperty decorators
│   └── ws/                     # Socket.io gateways
│
├── worker/                     # Background job processors
│   ├── video-processing.processor.ts
│   ├── transcription.processor.ts
│   ├── view-verification.processor.ts
│   └── payout.processor.ts
│
└── shared/                     # Cross-cutting concerns
    ├── guards/                 # Logto auth guard
    ├── interceptors/           # Logging, transform
    ├── filters/                # Global exception filter
    └── events/                 # Domain event bus
```

### 6.5 Infrastructure Cost

| Phase | Server | Cloud APIs | Total |
|-------|--------|-----------|-------|
| **MVP (0-1K users)** | $0 (existing 16GB/8core) | $0-72 | **$0-72/mo** |
| **Growth (1K-10K)** | $0 | $72-350 | **$72-350/mo** |
| **Scale (10K-50K)** | May need 2nd server | $200-681 | **$200-681/mo** |

---

## 7. Docker Compose Architecture

### 7.1 duta-api (Backend — all infrastructure)

```yaml
services:
  postgres:      # PostgreSQL 16 — shared: Duta DB + Logto DB
  redis:         # Redis 7 — cache, sessions, BullMQ queue
  typesense:     # Typesense — search engine (HA-ready)
  logto:         # Logto — SSO/auth server (:3301 admin, :3302 auth)
  api:           # NestJS API (:3001)
  worker:        # BullMQ + FFmpeg (no exposed port)
  prometheus:    # Metrics collection
  grafana:       # Monitoring dashboard (:3100)
  backup:        # pg_dump cron → R2
```

### 7.2 duta-web (Frontend)

```yaml
services:
  web:           # Next.js 15 (:3000)
```

### 7.3 Host-Level

```
Nginx → SSL (Let's Encrypt) → route:
  duta.val.id       → web:3000
  api.duta.val.id   → api:3001
  auth.duta.val.id  → logto:3302
```

---

# PART 3 — FEATURE SPECIFICATION

---

## 8. User Personas

| Persona | Who | Pain Point | Duta Solution |
|---------|-----|-----------|---------------|
| **Andi** (Creator) | YouTuber 50K subs, tech review | Fiverr inconsistent, Whop ribet | Vetted clippers, escrow, review flow |
| **Rina** (Solo Clipper) | Mahasiswi 22th, CapCut | Whop KYC ditolak, takut ga dibayar | KTP KYC, GoPay payout, escrow guarantee |
| **Budi** (Podcaster) | Podcast bisnis, 5K listeners | Tidak ada platform clip podcast | Podcast pipeline, audio-to-video kit |
| **Siti** (Brand Manager) | Startup marketing | Agency mahal, Fiverr ga scalable | Volume campaigns, agency clippers |
| **Team Rina** (Clipper Team) | 4 orang bareng | Manual manage, manual split payout | Team account, auto payout split |

## 9. Account Types & Verification

### 9.1 Account Types

| Type | Users | Verification | Features |
|------|-------|-------------|----------|
| **Solo Clipper** | Individual | KYC (KTP) | Join campaigns, submit clips, earn |
| **Content Owner** | Creator/Podcaster | KYC (KTP) | Create campaigns, review clips, pay |
| **Team** (v1.1) | 2-10 clippers | KYC per member | Shared campaigns, payout split |
| **Agency** (v2) | 10+ clippers | KYB (NPWP + akta) | Sub-teams, managers, finance module |
| **Admin** | Platform staff | Internal | Moderation, disputes, analytics |

### 9.2 Progressive Verification

| Tier | Requirement | Can Do | Cannot Do |
|------|------------|--------|-----------|
| **Tier 0** | Register (Logto) | Browse, view profiles | Join campaigns |
| **Tier 1** | Email verified | Join bounty (URL submit) | Withdraw, create gig |
| **Tier 2** | KYC (KTP + selfie via Xendit) | All features, withdraw to bank/e-wallet | Unlimited budget campaigns |
| **Tier 3** | KYB (NPWP + akta) | Enterprise features, unlimited budget | - |

### 9.3 Clipper Tier System (Career Progression)

| Tier | Score | Perks |
|------|-------|-------|
| **Bronze** (0-39) | New clipper | Bounty campaigns, learning resources |
| **Silver** (40-69) | Proven | All campaign types, portfolio showcase, gig eligible |
| **Gold** (70-89) | Expert | Featured in directory, premium rates, higher matching priority |
| **Platinum** (90-100) | Elite | Auto-approve eligible, exclusive campaigns, "Verified Pro" badge |

Score = views (30%) + approval rate (25%) + creator ratings (25%) + consistency (20%). Updated weekly.

---

## 10. Feature Specification

### 10.1 TIER 1 — CRUCIAL (MVP)

#### Campaign Management

- **Campaign creation wizard** — multi-step: type → content → rate → budget → guidelines → review → deposit
- **3 campaign types:** Bounty (open, pay-per-view), Gig (hire specific clipper), Podcast (RSS/upload)
- **Source content:** YouTube URL auto-import, video upload (TUS resumable via Uppy, max 5GB), audio upload (max 1GB), RSS feed import
- **Campaign guidelines:** rich text brief (Tiptap), do's/don'ts, target platforms, style references
- **Budget & escrow:** Xendit deposit → escrow lock → auto-release on clip approval. Auto-pause at 80% budget
- **Campaign lifecycle:** Draft → Active → Paused → Completed

#### Clip Submission & Review

- **3 submission modes:**
  1. **Link-only** (bounty): paste TikTok/Reels/Shorts URL. No file upload. 80% of traffic
  2. **Upload + review** (gig): TUS resumable upload via Uppy. Creator approves before clipper posts
  3. **Podcast hybrid:** browse transcript → use audio-to-video kit → submit
- **Review workflow:** Approve / Request Revision / Reject + feedback text
- **View verification:** Phyllo API (primary) + YouTube Data API v3 (fallback) + screenshot (manual). Window: 48-72h
- **Anti-fraud:** views >10x/h without engagement = suspicious, view-to-like <0.1% = bot, identical views = suspicious
- **Auto-payout:** verified views → earnings calculated → escrow released → Xendit disbursement (T+1)

#### Discovery & Search

- Campaign search: filter by niche, rate, platform, content type, budget remaining (Typesense)
- Clipper search: filter by niche, tier, rating, availability, rate
- Sort: newest, highest rate, most budget, best match

#### Payment & Earnings

- Deposit: Xendit (bank transfer VA, GoPay, Dana, OVO, ShopeePay)
- Withdrawal: Xendit disbursement to bank/e-wallet. Min Rp 50K. T+1
- Earnings dashboard: real-time (earned, pending, available, withdrawn)
- Transaction history with full audit trail
- Platform fee: auto-deducted, transparent

#### Communication

- In-app 1-to-1 chat (Socket.io) — attached to campaign/clip context
- Campaign group chat
- File sharing (images, short video previews)
- "Continue on WhatsApp/Telegram" deep links
- In-app notification center (bell icon, unread count, categorized)
- Email notifications (Resend)
- Real-time push via Socket.io
- Notification preferences (toggle per type)

#### Auth & Onboarding

- Logto: social login (Google, TikTok) + email/password + MFA
- Progressive verification (Tier 0-2)
- Guided onboarding checklist: "Complete profile, Upload portfolio, Join first campaign"
- Profile completion meter (gamified)
- Custom Logto sign-in UI (branded to Duta via Custom CSS or Bring Your Own UI)

#### Admin Panel

- User management: view, verify KYC, ban/suspend
- Dispute resolution: queue, evidence review, resolve
- Campaign moderation: flagged content, violations
- Financial dashboard: GMV, revenue, payouts, pending

### 10.2 TIER 2 — ESSENTIAL (v1.1, Month 5-8)

#### Clipper Career System

- Clipper scoring algorithm (views + approval + rating + consistency)
- Tier badges: Bronze → Silver → Gold → Platinum
- Public portfolio page: `duta.val.id/clipper/username` (SEO-indexed, shareable)
- Campaign leaderboard: top 10 per campaign by views
- Monthly awards: "Clipper of the Month" badge + bonus

#### Rating & Review

- Mutual review after completion (Airbnb-style mutual reveal)
- Category ratings — Clipper: Quality, Speed, Communication, Creativity. Creator: Communication, Brief clarity, Payment speed
- Transaction-only (can't review without completed deal)
- Aggregate scores on public profiles

#### Podcast Pipeline

- RSS feed import → auto-list episodes
- Deepgram Nova-3 transcription (streaming, diarization, Indonesian)
- Transcript viewer with timestamps + suggested moments marking
- Audio-to-video kit: templates (waveform + captions + background), export 9:16

#### Advanced Campaign Features

- Campaign templates (save & reuse)
- Batch clip approval
- Auto-approve for Gold+ clippers
- Campaign analytics (views over time, top clips, ROI)
- Campaign duplication

### 10.3 TIER 3 — MODERN/DIFFERENTIATOR (v2, Month 9+)

#### AI Features

- AI viral moment detector (transcript + audio analysis → suggested timestamps)
- AI clip scoring (predict virality from historical data)
- AI matching (clipper ↔ campaign based on niche + performance)
- AI brief generator (topic → campaign guidelines)

#### Multi-language & International

- AI dubbing: clip Bahasa → auto-dub English/Malay/Thai
- Multi-language captions (Deepgram + translation)
- Multi-language UI (Bahasa + English)
- Multi-currency via Stripe Connect

#### Team & Agency Accounts

- Team accounts: lead + members, shared campaigns, payout split (equal/performance/custom/commission)
- Team profile page: aggregate stats, member links
- Agency accounts: KYB verified, sub-teams, managers, finance module
- Agency dashboard: bulk operations, financial reports, team performance
- Campaign hiring filter: solo / team / agency / invite-only

#### Content Scheduling & Distribution

- Post scheduling to TikTok/Reels/Shorts from Duta
- Multi-platform export (auto-resize per platform)
- Content calendar

#### Advanced Analytics

- Creator analytics dashboard (views, GMV, ROI, niche performance)
- Clipper analytics (earnings trend, tier progress, niche performance)
- Platform-wide insights (trending niches, average rates)
- Webhook API for external integrations

#### Partnership Mode

- Long-term contracts (1-6 months, revenue sharing)
- Dedicated partnership workspace
- Performance milestones with bonuses

#### Marketplace Health

- ML fraud detection (view botting, fake accounts)
- Content fingerprinting (duplicate/stolen clip detection)
- Compliance dashboard (FTC disclosure tracking)
- Platform health metrics (supply/demand balance, liquidity score)

---

## 11. Upload Architecture

### 11.1 Three Submission Modes

**Mode 1: Link-Only (Bounty)** — Most common, zero upload
```
Clipper → post to TikTok/Reels/Shorts → paste URL in Duta → verify views → payout
```

**Mode 2: Upload + Review (Gig)** — File upload needed
```
Clipper → upload clip (Uppy + TUS resumable) → Creator review → approve → clipper posts → submit URL → verify → payout
```

**Mode 3: Podcast Hybrid** — Built-in tools
```
Clipper → browse transcript → use audio-to-video kit → export clip → Creator review → approve → clipper posts → verify → payout
```

### 11.2 Upload Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Uppy 4.0 (React hooks, drag-drop, progress, pause/resume) |
| Protocol | TUS (resumable chunked upload) |
| Backend | tus-node-server or @uppy/companion |
| Storage | Cloudflare R2 (S3 multipart) |
| Processing | FFmpeg via BullMQ worker (thumbnail, preview, waveform) |

### 11.3 R2 Bucket Structure

```
duta-uploads/
├── source/       # Original video/audio from creator (up to 5GB)
├── clips/        # Finished clips from clipper (up to 500MB)
├── thumbnails/   # Auto-generated thumbnails
├── previews/     # 30s preview clips
├── waveforms/    # Audio waveform PNGs
├── avatars/      # User profile photos
└── kyc/          # KTP + selfie documents (private, encrypted)
```

---

## 12. Data Model

### Key Entities

```
User
├── id, email, name, role (owner/clipper/admin)
├── bio, avatarUrl, nicheTags[], socialLinks (JSONB)
├── kycStatus, kycDocumentUrl, clipperScore
├── verificationTier (0/1/2/3)
└── emailVerified, createdAt, updatedAt

Organization (v1.1)
├── id, name, type (team/agency)
├── ownerId, bio, logo, nicheTags
├── kybStatus, kybDocuments
├── payoutMethod, platformFeeRate
└── createdAt

OrganizationMember (v1.1)
├── id, orgId, userId
├── role (owner/manager/clipper/finance)
├── subTeam, commissionRate
└── status (active/invited/removed)

Campaign
├── id, ownerId, type (bounty/gig/podcast)
├── title, description, guidelines (rich text)
├── sourceType, sourceUrl, sourceFileKey, sourceMetadata (JSONB)
├── ratePerKViews, budgetTotal, budgetSpent
├── targetPlatforms[], status (draft/active/paused/completed)
├── deadline
└── createdAt, updatedAt

Clip
├── id, campaignId, clipperId
├── fileKey, postedUrl, platform
├── status (submitted/under_review/approved/revision/rejected)
├── reviewFeedback, viewsVerified, earningsAmount
└── submittedAt, reviewedAt, createdAt

EscrowAccount
├── id, campaignId (unique)
├── totalDeposited, totalReleased, totalRefunded, balance
└── status (active/depleted/refunded)

Transaction
├── id, type (deposit/payout/refund/fee)
├── fromUserId, toUserId, campaignId, clipId
├── amount, currency, status (pending/processing/completed/failed)
├── paymentMethod, paymentReference
└── createdAt

PodcastEpisode
├── id, campaignId
├── title, description, audioUrl, audioFileKey
├── transcriptText, transcriptSegments[] (JSONB, with timestamps)
├── suggestedMoments[] (JSONB, timestamp ranges)
├── duration
└── createdAt

Conversation
├── id, campaignId, type (direct/campaign_group)
└── createdAt

Message
├── id, conversationId, senderId
├── content, attachments (JSONB)
├── readAt
└── createdAt

Review
├── id, reviewerId, revieweeId
├── campaignId, clipId
├── rating (1-5), categories (JSONB), comment
├── revealed (boolean — mutual reveal)
└── createdAt

Dispute
├── id, campaignId, clipId
├── raisedById, againstId
├── reason, evidence (JSONB)
├── status (open/under_review/resolved)
├── resolution, resolvedById
└── createdAt, resolvedAt

Notification
├── id, userId
├── type, title, body, data (JSONB)
├── readAt
└── createdAt
```

---

## 13. Security & Trust

### 13.1 KYC via Xendit

- KTP OCR (extract name, NIK, birth date)
- Selfie face match vs KTP photo
- E-wallet validator (verify GoPay/OVO/Dana legitimacy)
- Under-age prevention (KTP birth date → min 17 tahun)
- 1 KTP = 1 account (prevent farming)

### 13.2 Escrow & Payment Safety

- Creator deposit → Xendit escrow (sub-account) → lock until approval
- Auto-pause campaign at 80% budget (notify creator to top-up)
- Clipper guaranteed payment for verified views
- Dispute mediation: evidence submission → admin review → resolution (max 7 days)

### 13.3 Anti-Fraud

- View verification: Phyllo + YouTube API + statistical heuristics
- Content fingerprinting (v2): detect stolen/duplicate clips
- Account farming prevention: 1 KTP = 1 account
- Review fraud: mutual reveal, transaction-only reviews

### 13.4 Trust Badges

| Badge | Criteria |
|-------|----------|
| Email Verified | Tier 1 |
| KYC Verified (shield) | Tier 2 — KTP + selfie |
| KYB Verified (building) | Tier 3 — NPWP + akta |
| Trusted Clipper (star) | Gold+ tier, >20 reviews, >4.5 avg |
| Top Creator (crown) | >10 campaigns, >4.0 avg |
| Fast Payer (lightning) | Avg approval <24h |

---

## 14. Quality Standards

### 14.1 Frontend Quality

| Standard | Implementation |
|----------|---------------|
| Dark-first design | LCH color space, design dark theme first |
| Micro-interactions | Framer Motion, 200-500ms subtle animations |
| Type-safe variants | CVA (Class Variance Authority) |
| Accessible | Radix primitives (ARIA built-in) |
| Responsive | Mobile-first, 320px → 1920px |
| Performance | React Server Components, image optimization |

### 14.2 Backend Quality

| Standard | Implementation |
|----------|---------------|
| DDD architecture | Domain/Application/Infrastructure layers |
| CQRS | Separate commands and queries |
| Type safety | TypeScript strict, Zod at boundaries |
| API docs | Swagger/OpenAPI auto-generated |
| Logging | Pino structured JSON |
| Monitoring | Prometheus + Grafana |
| Testing | Jest (unit) + Supertest (integration) + Playwright (E2E) |
| Security | Helmet, rate limiting, CORS, CSP |
| Database | Prisma migrations (versioned, reversible) |
| Code quality | ESLint + Prettier + Husky pre-commit |

---

## 15. MVP Roadmap

### Phase 0: Foundation (Week 1-3)
- Repo setup (duta-api + duta-web), Docker Compose
- PostgreSQL schema (Prisma), Redis, Typesense
- Logto integration (auth)
- NestJS DDD skeleton + OpenAPI setup
- Next.js with shadcn/ui design system + Orval client generation
- Nginx + SSL (Let's Encrypt)

### Phase 1: Core Marketplace (Week 4-8)
- Campaign CRUD (bounty + gig)
- Source content upload (Uppy + TUS + R2)
- YouTube URL import
- Clip submission (link-only + file upload + review workflow)
- Campaign & clipper discovery (Typesense)
- Creator & clipper dashboards

### Phase 2: Trust Layer (Week 9-12)
- Xendit xenPlatform integration (sub-accounts)
- Escrow system (deposit → lock → release → refund)
- View verification (Phyllo + fallback)
- Earnings dashboard & withdrawal
- Dispute system
- KYC (Xendit: KTP + selfie)

### Phase 3: Communication & Polish (Week 13-16)
- Socket.io messaging (1-to-1, campaign group)
- Notification system (in-app + email via Resend)
- Onboarding checklist
- Admin panel
- Testing & security audit
- Beta launch (50 clippers + 10 creators)

### Post-MVP
- v1.1 (Month 5-8): Clipper scoring, reviews, podcast pipeline, advanced campaigns
- v2.0 (Month 9-12): AI features, teams/agencies, multi-language, scheduling
- v2.5 (Month 13+): Partnerships, advanced analytics, fraud detection

---

## Appendix A: Key Technology Decisions

| Decision | Choice | Why | Alternative Considered |
|----------|--------|-----|----------------------|
| Repo structure | 2 repos (api + web) | Independent deploy, separate teams | Monorepo (lost: independence) |
| API protocol | REST + OpenAPI | Language-agnostic, mobile-ready | tRPC (lost: non-TS clients) |
| Client generation | Orval | TanStack Query hooks, Zod validation | openapi-typescript (less features) |
| Auth | Logto (self-hosted) | Social login, customizable UI, Node.js | Keycloak (too heavy), Zitadel |
| Transcription | Deepgram Nova-3 | 40% cheaper, streaming, 99.99% SLA | Whisper (no streaming, pricier) |
| View verification | Phyllo API | Unified cross-platform, user-permissioned | Direct APIs (3x integration work) |
| Payment | Xendit xenPlatform | Sub-accounts, split payment, KYC, Indonesian | Midtrans (no marketplace features) |
| Job queue | BullMQ + Redis | High throughput, parent-child flows | pgboss (lower throughput) |
| Search | Typesense | HA clustering, C++, sub-50ms | Meilisearch (no clustering) |
| UI system | shadcn/ui 2026 | Zero bloat, RSC-native, Registry 2.0 | Ant Design (heavy), MUI (heavy) |
| Workflow | BullMQ (no framework) | Sufficient for MVP | Temporal (overkill), Trigger.dev (later) |
| Collaboration | Socket.io + deep links | Lightweight, no extra deps | Rocket.Chat (MongoDB dep, heavy) |

## Appendix B: Sources

### Market Data
- [Precedence Research — Creator Economy](https://www.precedenceresearch.com/creator-economy-market)
- [Business Research Insights — Short-form Video](https://www.businessresearchinsights.com/market-reports/short-form-video-market-117818)
- [DemandSage — Creator Economy Statistics 2026](https://www.demandsage.com/creator-economy-statistics/)

### Competitive Landscape
- [ContentGrip — Clipping Strategy](https://www.contentgrip.com/clipping-creator-marketing-strategy/)
- [TechTimes — Clipping 2026](https://www.techtimes.com/articles/314456/20260203/what-clipping-performance-based-distribution-model-revolutionizing-digital-advertising-2026.htm)
- [Variety — Clipping in Music](https://variety.com/2026/music/news/clipping-marketing-tool-took-over-music-industry-1236699705/)

### Technology
- [shadcn/ui Registry 2.0](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [Deepgram STT Comparison](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [REST vs tRPC vs GraphQL 2026](https://dev.to/pockit_tools/rest-vs-graphql-vs-trpc-vs-grpc-in-2026-the-definitive-guide-to-choosing-your-api-layer-1j8m)
- [Orval — OpenAPI Client Generation](https://orval.dev/)
- [Xendit xenPlatform](https://www.xendit.co/en/products/xenplatform/)
- [Phyllo API](https://www.getphyllo.com/)
- [Logto](https://logto.io/)
- [Typesense](https://typesense.org/)

### Marketplace Strategy
- [Cold Start Problem (a16z)](https://a16z.com/books/the-cold-start-problem/)
- [Come for Tool, Stay for Network](https://cdixon.org/2015/01/31/come-for-the-tool-stay-for-the-network/)
- [Marketplace Features 2026](https://www.rigbyjs.com/blog/services-marketplace-features)
- [Marketplace Trust & Safety](https://www.prove.com/blog/marketplace-risk-trends-2026-identity-trust-safety)

### Industry Pain Points
- [Whop Clipping Review](https://www.indishmarketer.com/whop-clipping-review-legit-or-scam/)
- [Kiip — Payment Infrastructure](https://kiip.app/articles/payment-infrastructure-clipping-platforms)
- [Creator Platform War 2026](https://techbullion.com/the-creator-platform-war-of-2026-how-patreon-whop-onlyfans-and-passes-stack-up/)
