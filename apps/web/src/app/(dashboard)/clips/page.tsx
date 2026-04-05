'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Scissors, ExternalLink, Search } from 'lucide-react';
import { useClipControllerListMyClips } from '@/generated/api/clip/clip';
import { ClipResponseDtoStatus } from '@/generated/api/model/clipResponseDtoStatus';
import type { ClipResponseDto } from '@/generated/api/model/clipResponseDto';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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

type StatusFilter = 'all' | ClipResponseDtoStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: ClipResponseDtoStatus.submitted, label: 'Submitted' },
  { value: ClipResponseDtoStatus.under_review, label: 'Under Review' },
  { value: ClipResponseDtoStatus.approved, label: 'Approved' },
  { value: ClipResponseDtoStatus.revision, label: 'Revisi' },
  { value: ClipResponseDtoStatus.rejected, label: 'Ditolak' },
];

function ClipRow({ clip }: { clip: ClipResponseDto }) {
  const statusCfg = STATUS_CONFIG[clip.status] ?? {
    label: clip.status,
    className: 'bg-muted text-muted-foreground',
  };
  const platformLabel =
    clip.platform
      ? PLATFORM_LABEL[clip.platform as unknown as string] ?? (clip.platform as unknown as string)
      : null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 flex-wrap">
      <div className="flex-1 min-w-0 space-y-1">
        {/* Campaign title + status */}
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

        {/* URL */}
        {clip.postedUrl && (
          <a
            href={clip.postedUrl as unknown as string}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{clip.postedUrl as unknown as string}</span>
          </a>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {platformLabel && <span className="capitalize">{platformLabel}</span>}
          {clip.viewsVerified > 0 && (
            <span>{clip.viewsVerified.toLocaleString('id-ID')} views</span>
          )}
          <span>
            Submitted:{' '}
            {new Date(clip.submittedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {clip.reviewedAt && (
            <span>
              Reviewed:{' '}
              {new Date(clip.reviewedAt as unknown as string).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Review feedback */}
        {clip.reviewFeedback && (
          <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Feedback: </span>
            {clip.reviewFeedback as unknown as string}
          </div>
        )}
      </div>

      {/* Right side: earnings + action */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        {clip.earningsAmount > 0 && (
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {formatRupiah(clip.earningsAmount)}
          </span>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/campaigns/${clip.campaignId}`}>Lihat Campaign</Link>
        </Button>
      </div>
    </div>
  );
}

function ClipsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function ClipsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: clipsData, isLoading } = useClipControllerListMyClips({ limit: 100 });

  const allClips: ClipResponseDto[] = clipsData?.data ?? [];
  const filteredClips =
    statusFilter === 'all' ? allClips : allClips.filter((c) => c.status === statusFilter);

  const totalEarnings = allClips.reduce((sum, c) => sum + c.earningsAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clip Saya</h2>
          <p className="text-muted-foreground">
            Semua clip yang telah Anda kirimkan ke berbagai campaign.
          </p>
        </div>
        {totalEarnings > 0 && (
          <div className="rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total Penghasilan: </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatRupiah(totalEarnings)}
            </span>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === 'all'
              ? allClips.length
              : allClips.filter((c) => c.status === f.value).length;
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              ].join(' ')}
            >
              {f.label}
              <span
                className={[
                  'rounded-full px-1.5 py-0 text-xs',
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <ClipsSkeleton />
      ) : filteredClips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Scissors className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-base">
                {statusFilter === 'all' ? 'Belum ada clip' : `Tidak ada clip dengan status "${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}"`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === 'all'
                  ? 'Bergabunglah ke campaign dan kirim clip pertama Anda.'
                  : 'Coba filter lain untuk melihat clip Anda.'}
              </p>
            </div>
            {statusFilter === 'all' && (
              <Button asChild>
                <Link href="/campaigns">
                  <Search className="h-4 w-4 mr-2" />
                  Jelajahi Campaign
                </Link>
              </Button>
            )}
            {statusFilter !== 'all' && (
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                Lihat Semua Clip
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredClips.length} dari {allClips.length} clip
          </p>
          {filteredClips.map((clip) => (
            <ClipRow key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
}
