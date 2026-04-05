# Duta Platform — Research & Design Document

**Tanggal:** 4 April 2026
**Status:** Draft v1
**Tipe:** Research + Platform Specification

---

# PART 1 — RESEARCH

---

## 1. Executive Summary

Duta adalah platform marketplace yang mempertemukan **content clipper** dengan **content owner** (YouTuber, podcaster, brand) untuk memviralkan konten melalui clipping — praktik memotong konten long-form menjadi short-form clips (TikTok, Reels, Shorts).

### Mengapa Sekarang?

- Creator economy global bernilai **$254.4B** (2025), proyeksi **$2.08T** di 2035 (CAGR 23.4%)
- Short-form video market: **$34.79B** (2024) → **$289.52B** (2032, CAGR 30.3%)
- Brand mengalokasikan **>$100M** untuk clipping di 2025 secara diam-diam
- Indonesia = pasar TikTok terbesar dunia (~125-130M users), YouTube terbesar ke-2 (~140M users)
- **207+ juta** kreator global, 10-20% aktif mencari bantuan clipping

### Mengapa Duta?

Platform clipping existing (Whop, Vyro, Clipping.io) memiliki masalah fundamental:
1. **Payment trust crisis** — clipper tidak dibayar saat budget habis, dispute tidak dimediasi
2. **Hanya bounty model** — tidak ada relationship building atau partnership jangka panjang
3. **Quality control minim** — oversaturasi clip berkualitas rendah
4. **Podcast clipping terabaikan** — semua platform fokus video
5. **KYC & payment barrier** — sulit untuk clipper di Indonesia/Asia

Duta hadir dengan 5 differentiator: Trust Layer, Clip Intelligence, Relationship Engine, Podcast-First Pipeline, dan Local-First Indonesia.

---

## 2. Market Analysis

### 2.1 Market Size

| Metrik | Nilai | Proyeksi | CAGR | Sumber |
|--------|-------|----------|------|--------|
| Creator Economy Global | $254.4B (2025) | $2.08T (2035) | 23.4% | Precedence Research |
| Short-form Video Market | $34.79B (2024) | $289.52B (2032) | 30.3% | Business Research Insights |
| Short-form Video Ad Spend | $111B (2025) | $1.04T (2026) | 5.1% YoY | Industry Reports |
| SE Asia Creator Economy | $12-17B (2024) | - | - | Industry Estimates |
| Indonesia Creator Economy | $5-7B (2024) | - | - | Kemenparekraf |

### 2.2 TAM / SAM / SOM

**TAM (Total Addressable Market):**
- 207M+ kreator global × rata-rata spending $200-$2,000/bulan untuk editing
- Estimasi: ~$50B/tahun (global content editing/repurposing market)

**SAM (Serviceable Addressable Market):**
- Kreator yang aktif butuh clipping (10-20% dari professional creators): ~5-10M kreator
- Fokus YouTube + Podcast creators di Indonesia + global English-speaking
- Estimasi: ~$5B/tahun

**SOM (Serviceable Obtainable Market) — Year 1:**
- Target: 5,000 kreator + 15,000 clipper di Indonesia
- Average transaction $50/bulan × 5,000 kreator = $250K/bulan = **$3M ARR** year 1
- Platform fee 10-15% = **$300K-$450K revenue** year 1

### 2.3 Indonesia Market Deep Dive

**Digital landscape:**
- 215M+ internet users, 170M+ social media users
- Mobile-first: 98% akses internet via mobile
- Penetrasi e-wallet tinggi: GoPay, OVO, Dana, ShopeePay
- Credit card penetration rendah (~5-7%) → harus support e-wallet & bank transfer

**Creator demographics:**
- Dominan usia 18-34, mobile-first
- Platform utama: YouTube, TikTok, Instagram
- Niche growing: Islamic content, gaming, lifestyle, edukasi
- Filipino & Indonesian editors = dominant supply-side workforce untuk English-language creator clipping (cost advantage + English proficiency)

**Payment habits:**
- Bank transfer (BCA, Mandiri, BRI) = dominan untuk transaksi besar
- E-wallet (GoPay, OVO, Dana) = populer untuk transaksi kecil-menengah
- PayPal penetrasi rendah, crypto masih niche

### 2.4 Key Trends

1. **Long-to-Short Pipeline** — Strategi dominan: 1 konten long-form → 5-15 short clips. Demand clipping eksponensial.
2. **AI + Human Hybrid** — AI tools (Opus Clip, Vidyo.ai) growing tapi masih kalah soal creative judgment. Best approach = AI assist + human execution.
3. **Performance-Based Model** — Bounty/pay-per-view menjadi standar industri ($0.50-$3/1K views).
4. **Podcast-to-Video** — 5M+ podcast bersaing untuk listener. Clip pendek = strategi growth #1. Market under-served.
5. **Creator Partnerships 2.0** — 47% marketer prefer long-term partnership over one-off. 71% kreator kasih diskon untuk partnership jangka panjang.

---

## 3. Competitive Landscape

### 3.1 Direct Competitors — Global Clipping Marketplaces

| Platform | Model | Rate | Funding/Traction | Strengths | Weaknesses |
|----------|-------|------|-------------------|-----------|------------|
| **Whop** | Bounty per views | $0.50-$3/1K views | Market leader, profitable | Largest network, brand recognition | Payment trust issues, no escrow, KYC barrier, no mediasi dispute |
| **Vyro** | Bounty per views | $3/1K views | Backed by MrBeast (Oct 2025) | Highest payout rate, celebrity backing | New, unproven at scale |
| **Clipping.io** | Performance-based | Varies | 10K+ clippers | Large clipper base | Less transparent |
| **Clipping.net** | Campaign marketplace | Up to $3/1K views | Growing | Brand-focused | Limited clipper tools |
| **ClipFarm** | Bounty per views | Per campaign | By Airrack (18.2M subs), client: HBO Max | Celebrity backing, brand clients | Whop-dependent |
| **ClipFlip** | Marketplace | Varies | - | Buy/sell clipping services | Smaller |
| **ClipUp** | Marketplace | Varies | - | Brands & creators | Smaller |
| **Clipify Media** | Campaign platform | Per campaign | - | Clean branding | Limited features |

### 3.2 Direct Competitors — Indonesia

| Platform | Model | Strengths | Weaknesses |
|----------|-------|-----------|------------|
| **Clipin.id** | Kolaborasi kreator-clipper | UI Indonesia, komunitas | Masih kecil, fitur basic |
| **Ternak Klip** | Marketplace klip | Paling dibicarakan | Basic features, no escrow |
| **Trybuzzer** | Campaign berbayar | Brand campaigns terstruktur | Bukan pure clipping platform |
| **ClipperVideo.id** | Lisensi video | Model pasif unik | Niche, tidak mainstream |
| **WeFluence.id** | Influencer marketing | Kolaborasi jangka panjang | Bukan clipping-focused |

### 3.3 AI Clipping Tools (Indirect Competitors)

| Tool | Harga | Strengths | Weaknesses |
|------|-------|-----------|------------|
| **Opus Clip** | ~$15-40/mo | Market leader, virality scoring | Output inconsistent, no creative judgment |
| **Vidyo.ai** | ~$30/mo | Auto-captions, multi-platform | Miss context, no human curation |
| **GetMunch** | ~$49/mo+ | Trend analysis | Expensive, AI picks sering salah |
| **Flowjin** | B2B focused | Agency workflow | Bukan marketplace |
| **Reap** | Varies | Multi-language, scheduling | Tool, bukan marketplace |
| **Descript** | ~$24/mo | Text-based editing, strong product | Editing tool, bukan marketplace |
| **Fame Clips** | AI+human | 5x lebih murah dari agency | Limited scale |

### 3.4 Freelance Platforms (Indirect)

| Platform | Relevance | Weaknesses untuk Clipping |
|----------|-----------|--------------------------|
| **Fiverr** | Large video editing category, $5-50/clip | No specialization, quality lottery, no content workflow |
| **Upwork** | Hourly/project video editors | High friction, not optimized for recurring clip work |

### 3.5 Gap Analysis

**Gap #1: Payment Trust** — Tidak ada platform yang menyediakan escrow + guaranteed payment + dispute mediation yang fair untuk kedua pihak.

**Gap #2: Relationship Depth** — Semua platform = transactional bounty. Tidak ada yang memfasilitasi partnership jangka panjang kreator-clipper.

**Gap #3: Podcast Clipping** — 0 marketplace yang fokus pada human podcast clipper. Hanya AI tools.

**Gap #4: Indonesia-Optimized** — Platform global sulit diakses (KYC, payment). Platform lokal masih basic.

**Gap #5: Quality Assurance** — Tidak ada platform dengan clipper vetting, scoring, dan quality gate yang serius.

---

## 4. Business Model

### 4.1 Revenue Streams

| Revenue Stream | Model | Estimasi |
|----------------|-------|----------|
| **Platform Fee (Primary)** | 10-15% dari setiap transaksi (dibagi: 5-8% dari kreator, 5-7% dari clipper) | Core revenue |
| **Premium Subscription — Kreator** | Rp 299K-999K/bulan: advanced analytics, priority matching, unlimited campaigns | Recurring |
| **Premium Subscription — Clipper** | Rp 99K-299K/bulan: portfolio boost, early access campaigns, badge | Recurring |
| **Featured Campaigns** | Kreator bayar extra untuk campaign tampil di homepage/top results | Ad revenue |
| **AI Tools Add-on** | AI timestamp suggestion, auto-caption, virality prediction — per-use atau subscription | Value-add |
| **Enterprise/Agency Plans** | Custom pricing untuk brand/agency dengan volume tinggi | High-value |

### 4.2 Pricing Strategy

**Bounty Campaign:**
- Kreator set rate: Rp 5.000-50.000 per 1K views (fleksibel)
- Platform fee: 10% dari total payout
- Minimum campaign budget: Rp 500.000

**Gig/Project:**
- Clipper set harga: Rp 50.000-500.000 per clip (negosiable)
- Platform fee: 12% dari transaksi
- Escrow: Dana di-hold sampai kreator approve

**Partnership (Phase 2):**
- Revenue sharing: Clipper dapat 20-50% dari revenue clip
- Platform fee: 5% dari shared revenue
- Kontrak: 1-6 bulan, renewable

### 4.3 Unit Economics

**Per Transaction (Bounty — average):**
- Average campaign budget: Rp 2.000.000
- Platform fee (10%): Rp 200.000
- Payment processing (Xendit ~2.5%): Rp 50.000
- **Net margin per campaign: Rp 150.000**

**Break-even Estimate:**
- Fixed costs (infra, team of 5): ~Rp 100M/bulan
- Needed: ~667 campaigns/bulan atau ~22 campaigns/hari
- Achievable at ~2,000 active kreator with 1 campaign/3 bulan

### 4.4 Monetization Phasing

| Phase | Timeline | Revenue Focus |
|-------|----------|---------------|
| Phase 1 (MVP) | Month 1-6 | Platform fee only (10-12%). Gratis untuk semua user. |
| Phase 2 | Month 6-12 | + Premium subscriptions, Featured campaigns |
| Phase 3 | Month 12-18 | + AI tools add-on, Partnership revenue share |
| Phase 4 | Month 18+ | + Enterprise plans, Global expansion revenue |

---

## 5. Go-to-Market Strategy

### 5.1 Launch Strategy: "Supply-First"

**Rationale:** Marketplace chicken-and-egg problem. Clipper akan datang kalau ada campaign. Kreator akan datang kalau ada clipper berkualitas. Solusi: **rekrut clipper dulu.**

**Phase 1 — Clipper Recruitment (Month -2 to 0):**
- Target: 500 clipper Indonesia dari komunitas existing (Discord, Twitter/X, Facebook Groups)
- Incentive: Early adopter badge, 0% platform fee untuk 3 bulan pertama
- Onboarding: Portfolio review, skill assessment, niche tagging
- Community: Discord/Telegram group khusus Duta Clippers

**Phase 2 — Creator Onboarding (Month 0 to 3):**
- Target: 100 kreator mid-tier (10K-100K subscribers) YouTube & podcaster Indonesia
- Approach: Direct outreach, free first campaign (Duta subsidize Rp 500K budget)
- Value prop: "500 vetted clippers siap memviralkan kontenmu. Coba gratis."
- Partnerships: Kolaborasi dengan MCN (Multi-Channel Network) Indonesia

**Phase 3 — Growth (Month 3 to 12):**
- Content marketing: Case studies "Kreator X dapat 1M views dari Duta clippers"
- Referral program: Kreator invite kreator → bonus budget. Clipper invite clipper → bonus payout.
- Podcast niche push: Target top 100 podcast Indonesia
- Brand partnerships: Approach brand/agency untuk enterprise campaigns

### 5.2 Marketing Channels

| Channel | Strategy | Priority |
|---------|----------|----------|
| **TikTok/Reels** | Ironic — use clipping to promote a clipping platform. Show clipper earnings, before/after clips | Tinggi |
| **YouTube** | Tutorial: "Cara jadi clipper penghasilan 10 juta/bulan" | Tinggi |
| **Twitter/X** | Creator economy discourse, thread tentang clipping industry | Medium |
| **Discord/Telegram** | Community building, clipper groups | Tinggi |
| **SEO** | "Platform clipper Indonesia", "cara jadi clipper", "jasa clipper video" | Medium |
| **Podcast Guesting** | Founder tampil di podcast Indonesia, pitch Duta | Medium |

### 5.3 Key Metrics

| Metric | Target Month 6 | Target Month 12 |
|--------|----------------|-----------------|
| Registered Clippers | 5,000 | 15,000 |
| Active Clippers (monthly) | 1,500 | 5,000 |
| Registered Creators | 500 | 2,000 |
| Active Campaigns (monthly) | 200 | 800 |
| GMV (monthly) | Rp 400M | Rp 2B |
| Platform Revenue (monthly) | Rp 40M | Rp 200M |
| Clipper Retention (monthly) | >60% | >65% |
| Creator Retention (monthly) | >50% | >55% |

---

# PART 2 — PLATFORM SPECIFICATION

---

## 6. Platform Overview & User Personas

### 6.1 Platform Name & Positioning

**Nama:** Duta
**Tagline:** "Viralkan Kontenmu"
**Positioning:** Platform marketplace terpercaya yang mempertemukan content clipper dengan content owner, dengan jaminan pembayaran fair, kualitas terjaga, dan dukungan penuh untuk video & podcast.

### 6.2 User Personas

**Persona 1: Kreator Andi (Content Owner)**
- YouTuber 50K subscribers, niche tech review Indonesia
- Upload 2 video/minggu, masing-masing 15-20 menit
- Ingin kontennya di-clip ke TikTok/Reels tapi tidak punya waktu/skill
- Budget: Rp 1-3M/bulan untuk clipping
- Pain point: Pernah coba Fiverr, kualitas inconsistent. Coba Whop, ribet KYC.

**Persona 2: Clipper Rina (Content Clipper)**
- Mahasiswi 22 tahun, skill video editing menengah (CapCut, Premiere)
- Cari side income dari clipping, target Rp 3-5M/bulan
- Sudah coba Whop tapi KYC ditolak (passport Indonesia)
- Pain point: Susah cari campaign yang reliable, takut tidak dibayar

**Persona 3: Podcaster Budi (Podcast Owner)**
- Host podcast bisnis, 5K listeners/episode
- Ingin grow audience lewat clip podcast ke sosmed
- Tidak tahu cara convert audio ke video clip yang menarik
- Pain point: Tidak ada platform clipping yang support podcast

**Persona 4: Brand Manager Siti (Enterprise)**
- Marketing manager di startup Indonesia
- Punya banyak konten webinar/interview yang bisa di-repurpose
- Butuh volume: 50+ clips/bulan secara konsisten
- Pain point: Agency mahal (Rp 500K/clip), Fiverr tidak scalable

### 6.3 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Content Owner** | Create campaigns, upload content, set rates, review/approve clips, manage payments, rate clippers |
| **Clipper** | Browse campaigns, submit clips, track earnings, withdraw funds, build portfolio |
| **Admin** | Manage users, handle disputes, moderate content, view analytics, manage payouts |
| **Enterprise** (Phase 2) | All Content Owner features + team management, bulk campaigns, dedicated support |

---

## 7. Feature Specification (MVP)

### 7.1 Core Features — Content Owner Side

**F1: Campaign Creation**
- Create bounty campaign: set judul, deskripsi, source content (YouTube URL atau upload), rate per 1K views, total budget, deadline
- Create gig request: set brief, deliverables, budget, deadline
- Upload source content: video (MP4, MOV, max 5GB) atau audio (MP3, WAV, max 1GB)
- YouTube URL import: auto-fetch metadata, thumbnail, duration
- Podcast RSS import: import episode list, audio URL, show notes
- Campaign settings: target platform (TikTok/Reels/Shorts), content guidelines, do's & don'ts
- Budget management: set total budget, auto-pause saat budget 80% (notifikasi top-up)

**F2: Clip Review & Approval**
- Dashboard: list semua submitted clips per campaign
- Video/audio preview player
- Approve / Request Revision / Reject dengan feedback
- Batch approve untuk high-volume campaigns
- Auto-approve option (untuk trusted clippers dengan score tinggi)

**F3: Creator Dashboard**
- Active campaigns overview
- Total views, approved clips, spending
- Top performing clips & clippers
- Clipper leaderboard per campaign

**F4: Clipper Discovery**
- Browse clipper profiles by niche, score, rate
- Filter: niche, rating, price range, availability
- View clipper portfolio (demo reel, past clips, stats)
- Invite clipper langsung ke campaign

### 7.2 Core Features — Clipper Side

**F5: Campaign Discovery**
- Browse available campaigns: filter by niche, rate, platform, content type (video/podcast)
- Campaign detail: source content preview, rate, budget remaining, guidelines
- Apply to campaign (for gig mode) atau langsung claim & clip (for bounty mode)
- Saved/bookmarked campaigns

**F6: Clip Submission**
- Upload finished clip (MP4, max 500MB)
- Link to posted clip (TikTok/Reels/Shorts URL)
- Auto-detect views via platform API atau manual screenshot verification
- Submission status tracking: pending review → approved/revision/rejected

**F7: Clipper Profile & Portfolio**
- Profile: bio, niche tags, skill level, equipment
- Portfolio: best clips showcase (up to 20)
- Stats: total views generated, approval rate, average rating
- Clipper Score (calculated): weighted combination of views, approval rate, consistency, ratings

**F8: Earnings & Withdrawal**
- Real-time earnings dashboard: earned, pending verification, available for withdrawal
- Withdrawal methods: bank transfer (BCA, Mandiri, BRI, etc.), e-wallet (GoPay, Dana, OVO)
- Minimum withdrawal: Rp 50.000
- Withdrawal processing: T+1 (next business day)

### 7.3 Core Features — Trust Layer (Secret Sauce #1)

**F9: Smart Escrow**
- Kreator deposit budget saat create campaign → dana locked di escrow
- Clipper earnings di-guarantee: views terverifikasi = pasti dibayar
- Auto-notification saat budget mencapai 80% → kreator bisa top-up atau campaign auto-pause
- Refund policy: unused budget refundable setelah campaign berakhir (minus processing fee)

**F10: Dispute Resolution**
- Either party bisa open dispute
- Evidence submission: screenshots, links, communication history
- Platform mediator review (admin team)
- Resolution timeline: max 7 hari kerja
- Fair outcome: refund, partial payment, atau full payment berdasarkan evidence

**F11: View Verification**
- Primary: Phyllo API — unified view count verification across TikTok, YouTube, Instagram (user-permissioned, normalized)
- Secondary: YouTube Data API v3 direct (fallback for YouTube-only)
- Fallback: Screenshot submission + manual admin review
- Anti-fraud heuristics: views naik >10x/jam tanpa engagement = suspicious, view-to-like ratio <0.1% = bot, identical views across multiple clips = suspicious
- Verification window: 48-72 jam setelah clip posting (TikTok views bisa delay)

### 7.4 Core Features — Clip Intelligence (Secret Sauce #2 — Partial MVP)

**F12: Clipper Scoring System**
- Algorithm: weighted score dari:
  - Average views per clip (30%)
  - Approval rate (25%)
  - Consistency / activity (20%)
  - Creator ratings (25%)
- Score range: 1-100, displayed as tier: Bronze / Silver / Gold / Platinum
- Updated weekly

**F13: Basic Smart Matching**
- Saat kreator create campaign, suggest top 10 clippers berdasarkan:
  - Niche match
  - Score tier
  - Past performance di niche serupa
  - Availability
- Saat clipper browse, sort by "best match" berdasarkan skill & niche

### 7.5 Core Features — Podcast Pipeline (Secret Sauce #4)

**F14: Podcast Import**
- RSS feed URL import: auto-list semua episode
- Manual audio upload (MP3, WAV, max 1GB)
- Auto-transcription via Deepgram Nova-3 (streaming, speaker diarization, Indonesian language support)
- Episode metadata: title, description, duration, publish date

**F15: Podcast Clip Tools**
- Transcript viewer dengan timestamp markers
- Kreator bisa mark "suggested clip moments" di transcript
- Clipper bisa browse transcript, dengar segment, pilih momen
- Audio waveform visualization

**F16: Audio-to-Video Kit**
- Template audiogram: waveform + captions + background
- Auto-generated captions dari transcript
- Clipper bisa customize: font, color, background image/video
- Export: format TikTok (9:16), Reels (9:16), Shorts (9:16), Twitter (16:9)

### 7.6 Core Features — Platform Essentials

**F17: User Authentication**
- Register/login via email + password
- OAuth: Google, TikTok (optional phase 2)
- KYC lite untuk clipper: KTP foto + selfie (Indonesian ID, bukan passport US)
- Email verification

**F18: Messaging**
- Direct message kreator ↔ clipper
- Campaign group chat (kreator + semua clippers di campaign)
- File sharing (images, short clips untuk feedback)
- Notification: in-app + email

**F19: Notification System**
- Campaign updates: new submission, approval, payment
- Earnings: payout processed, withdrawal complete
- System: new campaigns matching niche, promotions
- Channels: in-app, email, push (mobile phase 2)

**F20: Admin Panel**
- User management: view, ban, verify
- Campaign moderation: review flagged content
- Dispute management: case queue, evidence review, resolution
- Financial: transaction log, payout queue, revenue dashboard
- Analytics: GMV, active users, retention, top campaigns

---

## 8. User Flows

### 8.1 Content Owner — Create Bounty Campaign

```
Register/Login
    → Complete Profile (name, channel URL, niche)
    → Dashboard
    → "Create Campaign" button
    → Select type: Bounty Campaign
    → Input: title, description, content guidelines
    → Upload source: YouTube URL (auto-import) ATAU upload video/audio
    → Set rate: Rp X per 1K views
    → Set total budget: Rp Y (minimum 500K)
    → Set deadline (optional)
    → Set target platforms: TikTok / Reels / Shorts (multi-select)
    → Review & confirm
    → Payment: deposit budget via Xendit (bank transfer / e-wallet)
    → Campaign live! → Dana masuk escrow
    → Receive clip submissions
    → Review: Approve / Request Revision / Reject
    → Views verified → Clipper dibayar otomatis dari escrow
    → Campaign selesai / budget habis → refund sisa budget
```

### 8.2 Clipper — Join Bounty Campaign & Get Paid

```
Register/Login
    → Complete Profile (name, niche, skills)
    → Upload portfolio (minimum 3 sample clips)
    → KYC lite (KTP + selfie)
    → Browse Campaigns (filter by niche, rate, content type)
    → View Campaign Detail (source content, rate, guidelines)
    → "Join Campaign" button
    → Download/access source content
    → Create clip (external: CapCut, Premiere, etc.)
    → Submit clip: upload + link to posted clip
    → Wait for review
    → Approved → Views tracking starts
    → Views verified (48h) → Earnings added to balance
    → Withdraw: pilih metode (bank / e-wallet) → T+1 processing
```

### 8.3 Clipper — Apply for Gig

```
Browse Gigs (filter by budget, niche, deadline)
    → View Gig Detail (brief, deliverables, budget)
    → "Apply" → kirim proposal + relevant portfolio clips
    → Kreator review applications
    → Kreator accept → Gig starts, budget masuk escrow
    → Clipper create clips sesuai brief
    → Submit deliverables
    → Kreator review: Approve / Request Revision
    → Approved → Payment released dari escrow
    → Both parties rate each other
```

### 8.4 Podcast Owner — Create Podcast Clip Campaign

```
Dashboard → "Create Campaign"
    → Select type: Podcast Campaign
    → Input RSS feed URL → auto-import episodes
    → OR upload audio file manually
    → System auto-transcribes (Whisper)
    → Kreator review transcript, mark suggested clip moments (optional)
    → Set campaign details: rate, budget, guidelines
    → Deposit budget → escrow
    → Campaign live
    → Clipper join: browse transcript, listen segments, pick moments
    → Clipper use Audio-to-Video Kit: select template, customize captions
    → Submit finished video clip
    → Kreator review & approve
    → Views verified → payout
```

---

## 9. Technical Architecture

### 9.1 Tech Stack

**Deployment: Self-hosted via Docker Compose** pada dedicated server (16GB RAM, 8 cores, 159GB disk). Semua core services berjalan lokal, hanya external APIs yang bergantung pada cloud.

#### Self-Hosted Services (Docker Compose)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui | SSR/SSG untuk SEO, React Server Components, ecosystem terbesar |
| **Backend** | NestJS (TypeScript) + REST API | Modular architecture, guards/interceptors, WebSocket support |
| **Worker** | NestJS Standalone + BullMQ + FFmpeg | Separate process dari API. Video/audio processing, transcription jobs, payout jobs |
| **Database** | PostgreSQL 16 (via Prisma ORM) | Relational data: users, campaigns, transactions, reviews. JSONB untuk flexible metadata |
| **Cache & Queue** | Redis 7 + BullMQ | Session, caching, real-time presence, background job queue |
| **Search** | Meilisearch | Campaign & clipper search dengan typo-tolerance, faceted filtering |
| **Real-time** | Socket.io 4.8 + Redis Adapter (Pub/Sub) | Messaging, notifications, live view tracking. Redis adapter untuk multi-instance scaling |
| **Video Processing** | FFmpeg via BullMQ workers | Thumbnail generation, preview clips, audio waveform, transcode. Parent-child jobs (BullMQ 5 flows) |
| **Reverse Proxy** | Nginx (host-level) + Let's Encrypt | SSL termination, reverse proxy ke Docker containers |
| **Backup** | pg_dump + cron → Cloudflare R2 | Automated daily DB backup |

#### External Cloud Services (SaaS — tidak bisa self-host)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **File Storage** | Cloudflare R2 (primary) + Wasabi (backup) | R2: zero egress, CDN built-in. Wasabi: $6.99/TB backup storage |
| **CDN** | Cloudflare CDN | Global edge, Indonesian PoP (Jakarta + Singapore) |
| **Payment** | Xendit xenPlatform (Indonesia) + Stripe Connect (global, Phase 2) | xenPlatform: sub-accounts per clipper, auto split payment & disbursement. Supports GoPay, Dana, OVO, bank transfer |
| **Transcription** | Deepgram Nova-3 | 40% cheaper than Whisper ($4.30 vs $6/1K min), streaming support, speaker diarization, Indonesian language |
| **View Verification** | Phyllo API (primary) + YouTube Data API v3 (fallback) | Phyllo: unified API untuk TikTok, YouTube, Instagram. User-permissioned, normalized data |
| **Email** | Resend | Transactional email: verification, notifications. 3K/month free |
| **Monitoring** | Sentry (errors) | Error tracking. 5K events/month free |

### 9.2 Architecture Diagram (High-Level)

```
                         ┌──────────────┐
                         │   Cloudflare  │
                         │   CDN + DNS   │
                         └──────┬───────┘
                                │
                    ┌───────────▼───────────┐
                    │   Nginx (Host Level)   │
                    │   SSL (Let's Encrypt)  │
                    │   duta.val.id:443      │
                    └───┬──────────┬────────┘
                        │          │
              /api/*    │          │  /*
           /socket.io/* │          │
                        ▼          ▼
┌─────────────────────────────────────────────────────────┐
│                  DOCKER COMPOSE                          │
│                                                          │
│  ┌──────────┐    ┌──────────────────────────────────┐   │
│  │   web    │    │           api (:3001)             │   │
│  │  Next.js │    │         NestJS REST API           │   │
│  │  (:3000) │    │  ┌──────┐ ┌────────┐ ┌────────┐  │   │
│  │          │    │  │ Auth │ │Campaign│ │Payment │  │   │
│  └──────────┘    │  └──────┘ └────────┘ └────────┘  │   │
│                  │  ┌──────┐ ┌────────┐ ┌────────┐  │   │
│                  │  │Media │ │Podcast │ │Dispute │  │   │
│                  │  └──────┘ └────────┘ └────────┘  │   │
│                  │  ┌────────────┐ ┌─────────────┐  │   │
│                  │  │ Socket.io  │ │  Matching   │  │   │
│                  │  └────────────┘ └─────────────┘  │   │
│                  └──────────────┬────────────────────┘   │
│                                 │                        │
│       ┌─────────────────────────┼───────────────┐        │
│       ▼              ▼          ▼               ▼        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │postgres │  │  redis   │  │  meili   │  │ worker  │  │
│  │  :5432  │  │  :6379   │  │  :7700   │  │ BullMQ  │  │
│  │ 16GB    │  │ Cache +  │  │ Search   │  │ FFmpeg  │  │
│  │         │  │ Queue    │  │ Engine   │  │ Jobs    │  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘

External APIs (Cloud):
├── Cloudflare R2 (file storage + CDN)
├── Wasabi (backup storage)
├── Xendit xenPlatform (payment, escrow, disbursement)
├── Deepgram Nova-3 (podcast transcription)
├── Phyllo API (view verification: TikTok, YouTube, Instagram)
├── Resend (transactional email)
└── Sentry (error tracking)
```

### 9.2.1 Docker Compose Services

```yaml
# docker-compose.yml (overview)
services:
  postgres:    # PostgreSQL 16 — port 5432 (internal only)
  redis:       # Redis 7 — port 6379 (internal only)
  meilisearch: # Meilisearch — port 7700 (internal only)
  api:         # NestJS API — port 3001 → nginx
  worker:      # BullMQ + FFmpeg — no exposed port, connects to redis
  web:         # Next.js — port 3000 → nginx
  backup:      # pg_dump cron → R2 upload (daily)
```

### 9.2.2 File Storage Architecture

```
Upload Flow:
  Browser → API (presigned URL) → Direct upload to Cloudflare R2

Download/Stream Flow:
  Browser → Cloudflare CDN (cache) → R2 origin

Processing Flow:
  Worker → Download from R2 → FFmpeg process → Upload result to R2

R2 Bucket Structure:
  duta-uploads/
  ├── source/       # Original video/audio (up to 5GB)
  ├── clips/        # Finished clips (up to 500MB)
  ├── thumbnails/   # Auto-generated thumbnails
  ├── previews/     # 30s preview clips
  ├── waveforms/    # Audio waveform PNGs
  ├── avatars/      # User profile photos
  └── kyc/          # KTP + selfie documents (private)
```

### 9.3 Data Model (Key Entities)

```
User
├── id, email, password_hash, role (owner/clipper/admin)
├── profile: name, avatar, bio, niche_tags[], social_links
├── kyc_status: pending/verified/rejected
├── clipper_score (for clipper role)
└── created_at, updated_at

Campaign
├── id, owner_id (FK User), type (bounty/gig/podcast)
├── title, description, guidelines
├── source_content: { type, url, file_key, metadata }
├── rate_per_1k_views (for bounty)
├── budget_total, budget_spent, budget_remaining
├── target_platforms: [tiktok, reels, shorts]
├── status: draft/active/paused/completed
├── deadline
└─�� created_at, updated_at

Clip
├── id, campaign_id (FK Campaign), clipper_id (FK User)
├── file_key (R2), posted_url, platform
├── status: submitted/under_review/approved/revision/rejected
├── review_feedback
├── views_verified, earnings_amount
├── submitted_at, reviewed_at
└── created_at

Transaction
├── id, type (deposit/payout/refund/fee)
├── from_user_id, to_user_id
├── campaign_id (FK Campaign), clip_id (FK Clip)
├── amount, currency (IDR)
├── status: pending/processing/completed/failed
├── payment_method, payment_reference
└── created_at

EscrowAccount
├── id, campaign_id (FK Campaign)
├── total_deposited, total_released, total_refunded
├── balance
└── status: active/depleted/refunded

PodcastEpisode
├─��� id, campaign_id (FK Campaign)
├── title, description, audio_url, audio_file_key
├── transcript_text, transcript_segments[] (with timestamps)
├── suggested_moments[] (timestamp ranges marked by creator)
├── duration
└── created_at

Message
├── id, conversation_id
├── sender_id (FK User)
├── content, attachments[]
├── read_at
└── created_at

Review
├── id, reviewer_id, reviewee_id
├── campaign_id, clip_id
├── rating (1-5), comment
└── created_at

Dispute
├── id, campaign_id, clip_id
├── raised_by (FK User), against (FK User)
├── reason, evidence[]
├── status: open/under_review/resolved
├── resolution, resolved_by (FK User admin)
└── created_at, resolved_at
```

### 9.4 Estimated Infrastructure Cost

**Self-hosted model** — server sendiri + external APIs only.

#### Fixed Costs (Server)

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Dedicated Server (16GB/8core/159GB) | Existing | Sudah tersedia |
| Domain (duta.val.id) | ~$1 | Subdomain dari existing domain |
| SSL (Let's Encrypt) | $0 | Free, auto-renew via certbot |
| **Subtotal server** | **~$0** | |

#### Variable Costs (External APIs)

| Item | Monthly Cost (MVP) | Monthly Cost (Scale) | Notes |
|------|-------------------|---------------------|-------|
| Cloudflare R2 | $0 - $5 | $5 - $50 | 10GB free tier. $0.015/GB storage, $0 egress |
| Wasabi (backup) | $0 - $7 | $7 - $35 | $6.99/TB. Opsional untuk backup |
| Xendit fees | $0 - $50 | $50 - $500 | ~2.5% per transaksi. Scales with GMV |
| Deepgram | $0 - $10 | $10 - $50 | $200 free credit. $4.30/1K min after |
| Phyllo API | TBD (contact sales) | TBD | View verification. Free tier mungkin ada |
| Resend | $0 | $0 - $20 | 3K emails/month free |
| Sentry | $0 | $0 - $26 | 5K events/month free |
| **Subtotal APIs** | **$0 - $72** | **$72 - $681** |

#### Total

| Phase | Monthly Cost | Notes |
|-------|-------------|-------|
| **MVP (0-1K users)** | **$0 - $72** | Mostly free tiers |
| **Growth (1K-10K users)** | **$72 - $350** | API usage scales |
| **Scale (10K-50K users)** | **$200 - $681** | Mungkin perlu 2nd server untuk workers |

---

## 10. MVP Roadmap & Milestones

### 10.1 Development Phases

**Phase 0: Foundation (Week 1-2)**
- Project setup: monorepo, CI/CD, database schema
- Authentication system (email + password)
- Basic user profiles (owner & clipper)
- UI design system setup (shadcn/ui + brand theming)

**Phase 1: Core Marketplace (Week 3-6)**
- Campaign CRUD (bounty + gig types)
- Source content upload (video + YouTube URL import)
- Clip submission & review workflow
- Clipper profile & portfolio
- Campaign discovery (browse, filter, search)
- Basic dashboard (owner + clipper)

**Phase 2: Trust Layer (Week 7-9)**
- Xendit payment integration
- Escrow system: deposit, lock, release, refund
- View verification (API + screenshot fallback)
- Earnings dashboard & withdrawal system
- Dispute creation & admin resolution panel

**Phase 3: Podcast Pipeline (Week 10-12)**
- RSS feed import
- Audio upload & storage
- Whisper transcription integration
- Transcript viewer with timestamps
- Audio-to-video kit (basic templates, captions)

**Phase 4: Intelligence & Polish (Week 13-14)**
- Clipper scoring algorithm
- Basic smart matching (campaign → clipper suggestions)
- Messaging system
- Notification system (in-app + email)
- Admin panel

**Phase 5: Testing & Launch Prep (Week 15-16)**
- End-to-end testing
- Security audit (payment flow, auth, file upload)
- Performance optimization
- Beta testing dengan 50 clippers + 10 creators
- Bug fixes & polish

### 10.2 Post-MVP Roadmap

| Feature | Timeline | Priority |
|---------|----------|----------|
| Partnership mode (rev-share contracts) | Month 5-6 | High |
| AI timestamp suggestion (viral moment detection) | Month 5-6 | High |
| Mobile app (React Native / PWA) | Month 6-8 | High |
| OAuth login (Google, TikTok) | Month 5 | Medium |
| Enterprise/agency plans | Month 7-8 | Medium |
| Stripe Connect (global expansion) | Month 8-10 | Medium |
| Multi-language UI (English) | Month 8-10 | Medium |
| Advanced analytics & reporting | Month 6-7 | Medium |
| Auto-posting to social platforms | Month 9-12 | Low |
| Mobile app (native iOS/Android) | Month 12+ | Low |

### 10.3 Success Criteria (MVP Launch)

- [ ] Kreator bisa create bounty campaign dengan video/YouTube URL
- [ ] Kreator bisa create podcast campaign dengan RSS/audio upload
- [ ] Clipper bisa browse, join campaign, submit clips
- [ ] Escrow payment berfungsi end-to-end (deposit → verify → payout)
- [ ] View verification berfungsi (API + fallback)
- [ ] Clipper scoring menampilkan tier yang akurat
- [ ] Podcast transcription berfungsi dengan Whisper
- [ ] Audio-to-video kit menghasilkan clip yang bisa dipost
- [ ] Messaging berfungsi antara kreator & clipper
- [ ] Admin bisa handle disputes
- [ ] Withdrawal ke bank/e-wallet Indonesia berfungsi (T+1)
- [ ] Load test: 100 concurrent users tanpa degradasi

---

## Appendix A: Sources

### Market Data
- [Precedence Research — Creator Economy Market](https://www.precedenceresearch.com/creator-economy-market)
- [DemandSage — Creator Economy Statistics 2026](https://www.demandsage.com/creator-economy-statistics/)
- [Grand View Research — Creator Economy Market Report](https://www.grandviewresearch.com/industry-analysis/creator-economy-market-report)
- [Business Research Insights — Short-form Video Market](https://www.businessresearchinsights.com/market-reports/short-form-video-market-117818)
- [inBeat Agency — Creator Economy Statistics](https://inbeat.agency/blog/creator-economy-statistics)

### Competitive Landscape
- [ContentGrip — Clipping as a Creator Strategy](https://www.contentgrip.com/clipping-creator-marketing-strategy/)
- [TechTimes — What Is Clipping](https://www.techtimes.com/articles/314456/20260203/what-clipping-performance-based-distribution-model-revolutionizing-digital-advertising-2026.htm)
- [Variety — How Clipping Took Over the Music Biz](https://variety.com/2026/music/news/clipping-marketing-tool-took-over-music-industry-1236699705/)
- [Digiday — WTF is Clipping](https://digiday.com/media/wtf-is-clipping-the-low-lift-creator-strategy-grabbing-advertisers-attention/)
- [Ssemble — Vyro Review 2026](https://www.ssemble.com/blog/vyro-review-2026)
- [Sandi Hermawan — 5 Platform Clipper Indonesia](https://sandihermawan.com/platform-clipper-indonesia-terbaik/)
- [Clipin.id — Platform Kolaborasi Kreator Dan Clipper](https://clipin.id/)

### Industry Pain Points
- [IndishMarketer — Whop Clipping Review](https://www.indishmarketer.com/whop-clipping-review-legit-or-scam/)
- [Kiip — Payout Infrastructure for Clipping Platforms](https://kiip.app/articles/payment-infrastructure-clipping-platforms)
- [Ssemble — Clipping Monetization Strategies 2026](https://www.ssemble.com/blog/clipping-monetization-strategies-in-2026)

### Payment Infrastructure
- [Warta Ekonomi — Perbandingan Payment Gateway Indonesia 2025](https://wartaekonomi.co.id/read583685/perbandingan-payment-gateway-indonesia-2025-midtrans-vs-xendit-vs-doku-untuk-pemilik-usaha)
- [BuildWithAngga — Midtrans vs Xendit](https://buildwithangga.com/tips/perbedaan-midtrans-dan-xendit-payment-gateway-serta-kemudahan-integrasi-projek-website-laravel)

### Technology
- [OpusClip Blog — Best Video Clipping Platforms](https://www.opus.pro/blog/best-video-clipping-platforms-for-creators)
- [Flowjin — Best Podcast Clipping Tools](https://www.flowjin.com/blog/best-podcast-clipping-tools-for-agencies-2025-guide-comparison)
