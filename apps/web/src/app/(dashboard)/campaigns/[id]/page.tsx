'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogto } from '@logto/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipSubmitForm } from '@/components/clip-submit-form';
import { ClipReviewCard } from '@/components/clip-review-card';
import {
  useCampaignControllerGetCampaign,
  useCampaignControllerUpdateCampaign,
  getCampaignControllerGetCampaignQueryKey,
} from '@/generated/api/campaign/campaign';
import { useClipControllerListCampaignClips } from '@/generated/api/clip/clip';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
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
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const TYPE_LABEL: Record<string, string> = {
  bounty: 'Bounty',
  gig: 'Gig',
  podcast: 'Podcast',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [CampaignResponseDtoStatus.draft]: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  [CampaignResponseDtoStatus.active]: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [CampaignResponseDtoStatus.paused]: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [CampaignResponseDtoStatus.completed]: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

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

  function handleToggleStatus() {
    if (!campaign) return;
    const newStatus =
      campaign.status === CampaignResponseDtoStatus.active
        ? UpdateCampaignDtoStatus.paused
        : UpdateCampaignDtoStatus.active;
    updateCampaign({ id, data: { status: newStatus } });
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

  const statusCfg = STATUS_CONFIG[campaign.status] ?? {
    label: campaign.status,
    className: 'bg-muted text-muted-foreground',
  };

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

      {/* Header */}
      <div className="space-y-3">
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
            <span className={['text-xs font-semibold px-2 py-0.5 rounded-full', statusCfg.className].join(' ')}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/campaigns/${id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Campaign
              </Link>
            </Button>
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
          </div>
        )}
      </div>

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
          <div className="rounded-md bg-muted/50 border px-4 py-3">
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
        {/* Rate */}
        {campaign.ratePerKViews != null && (
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Rate per 1.000 Views
            </div>
            <p className="text-lg font-bold text-primary">
              {formatRupiah(campaign.ratePerKViews as unknown as number)}
            </p>
          </div>
        )}

        {/* Clip count */}
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Total Clips
          </div>
          <p className="text-lg font-bold">{campaign.clipCount}</p>
        </div>

        {/* Deadline */}
        {campaign.deadline && (
          <div className="rounded-lg border bg-card p-4 space-y-1">
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
          </div>
        )}

        {/* Budget */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Budget
            </div>
            <span className="text-xs text-muted-foreground">{budgetPercent}% terpakai</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
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
        </div>
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
        <section className="space-y-3 rounded-lg border bg-card p-5">
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
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Kamu belum pernah submit clip untuk campaign ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((clip) => (
                <ClipReviewCard key={clip.id} clip={clip} isOwner={false} campaignId={id} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Review clips (owner only) */}
      {isOwner && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Review Clips</h2>
          {clipsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : clips.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada clipper yang mengirimkan clip untuk campaign ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((clip) => (
                <ClipReviewCard key={clip.id} clip={clip} isOwner={true} campaignId={id} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
