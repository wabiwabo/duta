'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { CountUp } from '@/components/ui/count-up';
import { Sparkline } from '@/components/ui/sparkline';
import { StatusPill } from '@/components/ui/status-pill';
import { ShimmerBadge } from '@/components/ui/shimmer-badge';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  Megaphone,
  Scissors,
  Wallet,
  Star,
  PlusCircle,
  Search,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import { useCampaignControllerListCampaigns } from '@/generated/api/campaign/campaign';
import { useClipControllerListMyClips } from '@/generated/api/clip/clip';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';
import { CampaignResponseDtoStatus } from '@/generated/api/model/campaignResponseDtoStatus';
import { ClipResponseDtoStatus } from '@/generated/api/model/clipResponseDtoStatus';
import type { CampaignResponseDto } from '@/generated/api/model/campaignResponseDto';
import type { ClipResponseDto } from '@/generated/api/model/clipResponseDto';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
  shorts: 'YouTube Shorts',
};

const TIER_LABEL: Record<string, string> = {
  tier0: 'bronze',
  tier1: 'silver',
  tier2: 'gold',
  tier3: 'platinum',
};

// ----- Skeleton -----
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-6">
            <div className="shimmer h-4 w-28 rounded mb-3" />
            <div className="shimmer h-8 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ----- Owner Dashboard -----
function OwnerDashboard({ userName }: { userName: string }) {
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaignControllerListCampaigns(
    { limit: 100 },
  );

  const campaigns: CampaignResponseDto[] = campaignsData?.data ?? [];

  const totalClips = campaigns.reduce((sum, c) => sum + c.clipCount, 0);
  const totalBudgetSpent = campaigns.reduce((sum, c) => sum + c.budgetSpent, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === CampaignResponseDtoStatus.active).length;
  const recentCampaigns = campaigns.slice(0, 5);

  if (campaignsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Selamat datang, {userName}!</h2>
          <p className="text-muted-foreground">Kelola campaign dan pantau performa clip Anda.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Buat Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 shrink-0">
                  <Megaphone className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaign</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp target={campaigns.length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activeCampaigns} aktif</p>
            </div>
            <Sparkline data={[3, 5, 4, 7, 6, 8, 10]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shrink-0">
                  <Scissors className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Clip Diterima</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp target={totalClips} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dari semua campaign</p>
            </div>
            <Sparkline data={[2, 4, 3, 5, 7, 6, 9]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 shrink-0">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget Terpakai</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp
                  target={totalBudgetSpent}
                  prefix="Rp "
                  formatFn={(n) => n.toLocaleString('id-ID')}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">IDR</p>
            </div>
            <Sparkline data={[1, 3, 2, 5, 4, 7, 8]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent Campaigns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Campaign Terbaru</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campaigns">Lihat Semua</Link>
          </Button>
        </div>

        {recentCampaigns.length === 0 ? (
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Megaphone className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Belum ada campaign</p>
              <p className="text-sm text-muted-foreground">Mulai dengan membuat campaign pertama Anda.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0">
              <Link href="/campaigns/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Buat Campaign
              </Link>
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recentCampaigns.map((campaign) => {
              const budgetPercent =
                campaign.budgetTotal > 0
                  ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between gap-4 rounded-lg glass p-4 flex-wrap hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{campaign.title}</p>
                      <StatusPill status={campaign.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{campaign.clipCount} clips</span>
                      <span>
                        Budget: {formatRupiah(campaign.budgetSpent)} / {formatRupiah(campaign.budgetTotal)}{' '}
                        ({budgetPercent}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/campaigns/${campaign.id}`}>Lihat</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/campaigns/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Buat Campaign Baru
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/campaigns">
              <Megaphone className="h-4 w-4 mr-2" />
              Lihat Semua Campaign
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----- Clipper Dashboard -----
function ClipperDashboard({ userName, verificationTier }: { userName: string; verificationTier: string }) {
  const { data: clipsData, isLoading: clipsLoading } = useClipControllerListMyClips({ limit: 100 });

  const clips: ClipResponseDto[] = clipsData?.data ?? [];

  const totalEarnings = clips.reduce((sum, c) => sum + c.earningsAmount, 0);
  const approvedClips = clips.filter((c) => c.status === ClipResponseDtoStatus.approved);
  // Unique campaigns from clips
  const uniqueCampaignIds = new Set(clips.map((c) => c.campaignId));
  const recentClips = clips.slice(0, 5);

  // Map tier key (tier0..tier3) to display name for ShimmerBadge
  const tierDisplay = TIER_LABEL[verificationTier] ?? verificationTier.toLowerCase();

  if (clipsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Selamat datang, {userName}!</h2>
          <p className="text-muted-foreground">Pantau clip dan penghasilan Anda.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns">
            <Search className="h-4 w-4 mr-2" />
            Jelajahi Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 shrink-0">
                  <Megaphone className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Campaign Diikuti</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp target={uniqueCampaignIds.size} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Campaign unik</p>
            </div>
            <Sparkline data={[3, 5, 4, 7, 6, 8, 10]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shrink-0">
                  <Scissors className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Clip Dikirim</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp target={clips.length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{approvedClips.length} diapprove</p>
            </div>
            <Sparkline data={[2, 4, 3, 5, 7, 6, 9]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 shrink-0">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Penghasilan</p>
              </div>
              <div className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold">
                <CountUp
                  target={totalEarnings}
                  prefix="Rp "
                  formatFn={(n) => n.toLocaleString('id-ID')}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">IDR</p>
            </div>
            <Sparkline data={[1, 3, 2, 5, 4, 7, 8]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 shrink-0">
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Tier Saat Ini</p>
              </div>
              <div className="text-2xl font-bold">
                <ShimmerBadge tier={tierDisplay} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Verification tier</p>
            </div>
            <Sparkline data={[4, 4, 5, 6, 6, 7, 7]} width={80} height={32} className="shrink-0 mt-1" />
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent Clips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Clip Terbaru</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clips">Lihat Semua</Link>
          </Button>
        </div>

        {recentClips.length === 0 ? (
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Scissors className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Belum ada clip</p>
              <p className="text-sm text-muted-foreground">Mulai dengan bergabung ke campaign dan kirim clip pertama Anda.</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0">
              <Link href="/campaigns">
                <Search className="h-4 w-4 mr-2" />
                Jelajahi Campaign
              </Link>
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recentClips.map((clip) => {
              const platformLabel =
                clip.platform
                  ? PLATFORM_LABEL[clip.platform as unknown as string] ?? (clip.platform as unknown as string)
                  : null;

              return (
                <div
                  key={clip.id}
                  className="flex items-center justify-between gap-4 rounded-lg glass p-4 flex-wrap hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {clip.campaign?.title ?? `Campaign #${clip.campaignId.slice(0, 8)}`}
                      </p>
                      <StatusPill status={clip.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {platformLabel && <span className="capitalize">{platformLabel}</span>}
                      {clip.postedUrl && (
                        <a
                          href={clip.postedUrl as unknown as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </a>
                      )}
                      <span>
                        {new Date(clip.submittedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {clip.earningsAmount > 0 && (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatRupiah(clip.earningsAmount)}
                      </span>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/campaigns/${clip.campaignId}`}>Lihat</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/campaigns">
              <Search className="h-4 w-4 mr-2" />
              Jelajahi Campaign
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clips">
              <TrendingUp className="h-4 w-4 mr-2" />
              Lihat Semua Clip Saya
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----- Main Dashboard Page -----
export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useUserControllerGetProfile();

  if (profileLoading || !profile) {
    return <DashboardSkeleton />;
  }

  if (profile.role === UserProfileDtoRole.owner || profile.role === UserProfileDtoRole.admin) {
    return (
      <div className="space-y-6">
        <OnboardingChecklist />
        <OwnerDashboard userName={profile.name} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OnboardingChecklist />
      <ClipperDashboard
        userName={profile.name}
        verificationTier={profile.verificationTier}
      />
    </div>
  );
}
