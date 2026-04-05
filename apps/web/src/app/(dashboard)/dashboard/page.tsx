'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';
import { CampaignResponseDtoStatus } from '@/generated/api/model/campaignResponseDtoStatus';
import { ClipResponseDtoStatus } from '@/generated/api/model/clipResponseDtoStatus';
import type { CampaignResponseDto } from '@/generated/api/model/campaignResponseDto';
import type { ClipResponseDto } from '@/generated/api/model/clipResponseDto';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [CampaignResponseDtoStatus.draft]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  [CampaignResponseDtoStatus.active]: {
    label: 'Aktif',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  [CampaignResponseDtoStatus.paused]: {
    label: 'Dijeda',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [CampaignResponseDtoStatus.completed]: {
    label: 'Selesai',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const CLIP_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [ClipResponseDtoStatus.submitted]: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [ClipResponseDtoStatus.under_review]: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [ClipResponseDtoStatus.approved]: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [ClipResponseDtoStatus.revision]: {
    label: 'Revisi',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  [ClipResponseDtoStatus.rejected]: {
    label: 'Ditolak',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
  shorts: 'YouTube Shorts',
};

const TIER_LABEL: Record<string, string> = {
  tier0: 'Bronze',
  tier1: 'Silver',
  tier2: 'Gold',
  tier3: 'Platinum',
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
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaign</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaigns.filter((c) => c.status === CampaignResponseDtoStatus.active).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clip Diterima</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClips}</div>
            <p className="text-xs text-muted-foreground mt-1">Dari semua campaign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget Terpakai</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalBudgetSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">IDR</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Campaign Terbaru</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campaigns">Lihat Semua</Link>
          </Button>
        </div>

        {recentCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Megaphone className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium">Belum ada campaign</p>
                <p className="text-sm text-muted-foreground">Mulai dengan membuat campaign pertama Anda.</p>
              </div>
              <Button asChild>
                <Link href="/campaigns/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Buat Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentCampaigns.map((campaign) => {
              const statusCfg = CAMPAIGN_STATUS_CONFIG[campaign.status] ?? {
                label: campaign.status,
                className: 'bg-muted text-muted-foreground',
              };
              const budgetPercent =
                campaign.budgetTotal > 0
                  ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{campaign.title}</p>
                      <span
                        className={[
                          'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                          statusCfg.className,
                        ].join(' ')}
                      >
                        {statusCfg.label}
                      </span>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Diikuti</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCampaignIds.size}</div>
            <p className="text-xs text-muted-foreground mt-1">Campaign unik</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clip Dikirim</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{approvedClips.length} diapprove</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penghasilan</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">IDR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Saat Ini</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TIER_LABEL[verificationTier] ?? verificationTier}</div>
            <p className="text-xs text-muted-foreground mt-1">Verification tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Clip Terbaru</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clips">Lihat Semua</Link>
          </Button>
        </div>

        {recentClips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Scissors className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium">Belum ada clip</p>
                <p className="text-sm text-muted-foreground">Mulai dengan bergabung ke campaign dan kirim clip pertama Anda.</p>
              </div>
              <Button asChild>
                <Link href="/campaigns">
                  <Search className="h-4 w-4 mr-2" />
                  Jelajahi Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentClips.map((clip) => {
              const statusCfg = CLIP_STATUS_CONFIG[clip.status] ?? {
                label: clip.status,
                className: 'bg-muted text-muted-foreground',
              };
              const platformLabel =
                clip.platform
                  ? PLATFORM_LABEL[clip.platform as unknown as string] ?? (clip.platform as unknown as string)
                  : null;

              return (
                <div
                  key={clip.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {clip.campaign?.title ?? `Campaign #${clip.campaignId.slice(0, 8)}`}
                      </p>
                      <span
                        className={[
                          'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                          statusCfg.className,
                        ].join(' ')}
                      >
                        {statusCfg.label}
                      </span>
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
    return <OwnerDashboard userName={profile.name} />;
  }

  return (
    <ClipperDashboard
      userName={profile.name}
      verificationTier={profile.verificationTier}
    />
  );
}
