'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogto } from '@logto/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusPill } from '@/components/ui/status-pill';
import { ShimmerBadge } from '@/components/ui/shimmer-badge';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { CountUp } from '@/components/ui/count-up';
import { ClipSubmitForm } from '@/components/clip-submit-form';
import { ClipReviewCard } from '@/components/clip-review-card';
import { DepositDialog } from '@/components/deposit-dialog';
import {
  useCampaignControllerGetCampaign,
  useCampaignControllerUpdateCampaign,
  getCampaignControllerGetCampaignQueryKey,
} from '@/generated/api/campaign/campaign';
import { useClipControllerListCampaignClips } from '@/generated/api/clip/clip';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import {
  useClipperControllerGetCampaignLeaderboard,
  useClipperControllerGetCampaignAnalytics,
  useClipperControllerDuplicateCampaign,
  useClipperControllerBatchReviewClips,
} from '@/generated/api/clipper/clipper';
import { CampaignResponseDtoStatus } from '@/generated/api/model/campaignResponseDtoStatus';
import { UpdateCampaignDtoStatus } from '@/generated/api/model/updateCampaignDtoStatus';
import {
  Calendar,
  Users,
  TrendingUp,
  Wallet,
  ExternalLink,
  Edit,
  Pause,
  Play,
  ChevronLeft,
  Copy,
  Trophy,
  BarChart2,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const TYPE_LABEL: Record<string, string> = {
  bounty: 'Bounty',
  gig: 'Gig',
  podcast: 'Podcast',
};

const TYPE_HERO_GRADIENT: Record<string, string> = {
  bounty: 'bg-gradient-to-r from-green-900/30 to-emerald-900/30',
  gig: 'bg-gradient-to-r from-purple-900/30 to-violet-900/30',
  podcast: 'bg-gradient-to-r from-amber-900/30 to-orange-900/30',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

type ActiveTab = 'detail' | 'leaderboard' | 'analytics' | 'clips';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('detail');
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());

  const { isAuthenticated } = useLogto();

  const {
    data: campaign,
    isLoading: campaignLoading,
    isError: campaignError,
  } = useCampaignControllerGetCampaign(id);

  const { data: profileData, isLoading: profileLoading } = useUserControllerGetProfile({
    query: { enabled: isAuthenticated },
  });

  const isOwner = isAuthenticated && profileData?.id === campaign?.ownerId;
  const isClipper = isAuthenticated && profileData?.role === 'clipper';

  const { data: clipsData, isLoading: clipsLoading } = useClipControllerListCampaignClips(
    id,
    undefined,
    { query: { enabled: isAuthenticated && (isOwner || isClipper) } },
  );

  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useClipperControllerGetCampaignLeaderboard(id, {
      query: { enabled: activeTab === 'leaderboard' },
    });

  const { data: analyticsData, isLoading: analyticsLoading } =
    useClipperControllerGetCampaignAnalytics(id, {
      query: { enabled: isOwner && activeTab === 'analytics' },
    });

  const { mutate: updateCampaign, isPending: isUpdating } = useCampaignControllerUpdateCampaign({
    mutation: {
      onSuccess: () => {
        toast.success('Campaign berhasil diperbarui.');
        queryClient.invalidateQueries({
          queryKey: getCampaignControllerGetCampaignQueryKey(id),
        });
      },
      onError: () => {
        toast.error('Gagal memperbarui campaign. Coba lagi.');
      },
    },
  });

  const { mutate: duplicateCampaign, isPending: isDuplicating } =
    useClipperControllerDuplicateCampaign({
      mutation: {
        onSuccess: (data) => {
          toast.success('Campaign berhasil diduplikat sebagai draft.');
          router.push(`/campaigns/${data.id}`);
        },
        onError: () => {
          toast.error('Gagal menduplikat campaign. Coba lagi.');
        },
      },
    });

  const { mutate: batchReview, isPending: isBatchReviewing } =
    useClipperControllerBatchReviewClips({
      mutation: {
        onSuccess: (data) => {
          toast.success(`${data.updated} clip berhasil diapprove.`);
          setSelectedClipIds(new Set());
          queryClient.invalidateQueries({
            queryKey: getCampaignControllerGetCampaignQueryKey(id),
          });
        },
        onError: () => {
          toast.error('Gagal batch approve. Coba lagi.');
        },
      },
    });

  function handleToggleStatus() {
    if (!campaign) return;
    const newStatus =
      campaign.status === CampaignResponseDtoStatus.active
        ? UpdateCampaignDtoStatus.paused
        : UpdateCampaignDtoStatus.active;
    updateCampaign({ id, data: { status: newStatus } });
  }

  function handleToggleClipSelect(clipId: string) {
    setSelectedClipIds((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) next.delete(clipId);
      else next.add(clipId);
      return next;
    });
  }

  function handleBatchApprove() {
    if (selectedClipIds.size === 0) return;
    batchReview({ data: { clipIds: Array.from(selectedClipIds), action: 'approve' } });
  }

  if (campaignLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <DetailSkeleton />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg font-semibold text-destructive">Campaign tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/campaigns')}>
          Kembali ke Campaigns
        </Button>
      </div>
    );
  }

  const budgetPercent =
    campaign.budgetTotal > 0
      ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  const clips = clipsData?.data ?? [];

  const heroGradient = TYPE_HERO_GRADIENT[campaign.type] ?? TYPE_HERO_GRADIENT.bounty;

  const tabItems = [
    { id: 'detail', label: 'Detail' },
    { id: 'leaderboard', label: 'Leaderboard' },
    ...(isOwner
      ? [
          { id: 'analytics', label: 'Analytics' },
          { id: 'clips', label: 'Clips' },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back navigation */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Campaigns
      </Link>

      {/* Hero Banner */}
      <div className={cn('rounded-xl p-6 -mb-2', heroGradient)}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
            <p className="text-sm text-muted-foreground">
              oleh{' '}
              <span className="font-medium text-foreground">{campaign.owner.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="capitalize">
              {TYPE_LABEL[campaign.type] ?? campaign.type}
            </Badge>
            <StatusPill status={campaign.status} />
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap pt-4">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/campaigns/${id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Campaign
              </Link>
            </Button>
            <DepositDialog campaignId={id} />
            {(campaign.status === CampaignResponseDtoStatus.active ||
              campaign.status === CampaignResponseDtoStatus.paused) && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={handleToggleStatus}
              >
                {campaign.status === CampaignResponseDtoStatus.active ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Pause Campaign
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Aktifkan Campaign
                  </>
                )}
              </Button>
            )}
            {/* Duplicate campaign */}
            <Button
              size="sm"
              variant="outline"
              disabled={isDuplicating}
              onClick={() => duplicateCampaign({ id })}
            >
              {isDuplicating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              Duplikat
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <AnimatedTabs
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ActiveTab)}
      />

      {/* Tab: Detail */}
      {activeTab === 'detail' && (
        <div className="space-y-8">
          {/* Description */}
          <section className="space-y-2">
            <h2 className="text-base font-semibold">Deskripsi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </p>
          </section>

          {/* Guidelines */}
          {campaign.guidelines && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Guidelines</h2>
              <div className="glass rounded-xl px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {campaign.guidelines as unknown as string}
                </p>
              </div>
            </section>
          )}

          {/* Source content */}
          {campaign.sourceUrl && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Konten Sumber</h2>
              <a
                href={campaign.sourceUrl as unknown as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {campaign.sourceUrl as unknown as string}
              </a>
            </section>
          )}

          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {campaign.ratePerKViews != null && (
              <GlassCard hover={false} className="p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Rate per 1.000 Views
                </div>
                <p className="text-lg font-bold text-primary">
                  <CountUp
                    target={campaign.ratePerKViews as unknown as number}
                    prefix="Rp "
                    formatFn={(n) => n.toLocaleString('id-ID')}
                  />
                </p>
              </GlassCard>
            )}

            <GlassCard hover={false} className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Total Clips
              </div>
              <p className="text-lg font-bold">
                <CountUp target={campaign.clipCount} />
              </p>
            </GlassCard>

            {campaign.deadline && (
              <GlassCard hover={false} className="p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Deadline
                </div>
                <p className="text-base font-semibold">
                  {new Date(campaign.deadline as unknown as string).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </GlassCard>
            )}

            <GlassCard hover={false} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Budget
                </div>
                <span className="text-xs text-muted-foreground">{budgetPercent}% terpakai</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full gradient-fill transition-all"
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Terpakai: <span className="font-medium text-foreground">{formatRupiah(campaign.budgetSpent)}</span>
                </span>
                <span className="text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{formatRupiah(campaign.budgetTotal)}</span>
                </span>
              </div>
            </GlassCard>
          </div>

          {/* Target platforms */}
          {campaign.targetPlatforms.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Target Platform</h2>
              <div className="flex flex-wrap gap-2">
                {campaign.targetPlatforms.map((p) => (
                  <Badge key={p} variant="outline" className="capitalize">
                    {p}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Clip submission (clipper only) */}
          {isClipper && !isOwner && campaign.status === CampaignResponseDtoStatus.active && (
            <section className="space-y-3 glass rounded-xl p-5">
              <h2 className="text-base font-semibold">Submit Clip</h2>
              <p className="text-sm text-muted-foreground">
                Sudah membuat konten untuk campaign ini? Submit clip kamu di sini.
              </p>
              <ClipSubmitForm campaignId={id} />
            </section>
          )}

          {/* My clips (clipper only) */}
          {isClipper && !isOwner && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Clip Saya</h2>
              {clipsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : clips.length === 0 ? (
                <GlassCard hover={false} className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Kamu belum pernah submit clip untuk campaign ini.
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {clips.map((clip) => (
                    <ClipReviewCard key={clip.id} clip={clip} isOwner={false} campaignId={id} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Clippers
          </h2>
          {leaderboardLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : !leaderboardData?.data.length ? (
            <GlassCard hover={false} className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Belum ada clip yang diapprove.</p>
            </GlassCard>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Clipper</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Views</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Clips</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.data.map((entry) => {
                    return (
                      <tr key={entry.clipperId} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-muted-foreground">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/clipper/${entry.clipperId}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {entry.clipperName}
                            </Link>
                            <ShimmerBadge tier={entry.clipperTier} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatNumber(entry.views)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{entry.clipsCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab: Analytics (owner only) */}
      {activeTab === 'analytics' && isOwner && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Analytics
          </h2>
          {analyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ) : !analyticsData ? (
            <p className="text-sm text-muted-foreground">Belum ada data analytics.</p>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-xl font-bold">
                    <CountUp target={analyticsData.totalViews} formatFn={(n) => formatNumber(n)} />
                  </p>
                </div>
                <div className="glass rounded-xl p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Clips</p>
                  <p className="text-xl font-bold">
                    <CountUp target={analyticsData.totalClips} />
                  </p>
                </div>
                <div className="glass rounded-xl p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="text-xl font-bold">
                    <CountUp
                      target={analyticsData.totalEarnings}
                      prefix="Rp "
                      formatFn={(n) => n.toLocaleString('id-ID')}
                    />
                  </p>
                </div>
                <div className="glass rounded-xl p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Budget Terpakai</p>
                  <p className="text-xl font-bold">
                    <CountUp target={analyticsData.budgetUtilizationPct} suffix="%" />
                  </p>
                </div>
              </div>

              {/* Views over time bar chart */}
              {analyticsData.viewsOverTime.length > 0 && (
                <div className="glass rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Views per Hari (30 Hari Terakhir)</h3>
                  <div className="flex items-end gap-1 h-32 overflow-x-auto pb-6">
                    {(() => {
                      const maxViews = Math.max(...analyticsData.viewsOverTime.map((d) => d.views), 1);
                      return analyticsData.viewsOverTime.map((d) => (
                        <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[28px] h-full justify-end">
                          <div
                            className="w-full gradient-fill rounded-sm min-h-[2px]"
                            style={{ height: `${Math.max((d.views / maxViews) * 100, 2)}%` }}
                            title={`${d.date}: ${d.views} views`}
                          />
                          <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Top clips */}
              {analyticsData.topClips.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Top 5 Clips</h3>
                  <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Clipper</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Platform</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Views</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topClips.map((clip) => (
                          <tr key={clip.id} className="border-t border-border/40">
                            <td className="px-4 py-3">{clip.clipperName}</td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">{(clip.platform as unknown as string) ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatNumber(clip.views)}</td>
                            <td className="px-4 py-3 text-right text-primary">{formatRupiah(clip.earnings)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top platforms */}
              {analyticsData.topPlatforms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Top Platform</h3>
                  <div className="space-y-2">
                    {(() => {
                      const maxViews = Math.max(...analyticsData.topPlatforms.map((p) => p.views), 1);
                      return analyticsData.topPlatforms.map((p) => (
                        <div key={p.platform} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium capitalize">{p.platform}</span>
                            <span className="text-muted-foreground">{formatNumber(p.views)} views</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-fill"
                              style={{ width: `${(p.views / maxViews) * 100}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Tab: Clips with batch review (owner only) */}
      {activeTab === 'clips' && isOwner && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Review Clips</h2>
            {selectedClipIds.size > 0 && (
              <Button
                size="sm"
                disabled={isBatchReviewing}
                onClick={handleBatchApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isBatchReviewing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                )}
                Approve {selectedClipIds.size} Clip
              </Button>
            )}
          </div>

          {clipsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : clips.length === 0 ? (
            <GlassCard hover={false} className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada clipper yang mengirimkan clip untuk campaign ini.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {clips.map((clip) => {
                const isSelectable =
                  clip.status === 'submitted' || clip.status === 'under_review';
                return (
                  <div key={clip.id} className="flex items-start gap-3">
                    {isSelectable ? (
                      <input
                        type="checkbox"
                        className="mt-4 h-4 w-4 rounded border-border cursor-pointer accent-primary"
                        checked={selectedClipIds.has(clip.id)}
                        onChange={() => handleToggleClipSelect(clip.id)}
                      />
                    ) : (
                      <div className="w-7 shrink-0" />
                    )}
                    <div className="flex-1">
                      <ClipReviewCard clip={clip} isOwner={true} campaignId={id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
