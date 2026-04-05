'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useClipperControllerGetClipperProfile,
} from '@/generated/api/clipper/clipper';
import {
  Star,
  TrendingUp,
  Video,
  Briefcase,
  ChevronLeft,
  Share2,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  bronze: { label: 'Bronze', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  silver: { label: 'Silver', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300' },
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  platinum: { label: 'Platinum', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicClipperProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading, isError } = useClipperControllerGetClipperProfile(id);

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <p className="text-lg font-semibold text-destructive">Clipper tidak ditemukan.</p>
        <Button variant="outline" asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  const tierCfg = TIER_CONFIG[profile.clipperTier] ?? TIER_CONFIG.bronze;
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Back / breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-5 flex-wrap">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={(profile.avatarUrl as unknown as string) ?? undefined} alt={profile.name} />
          <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierCfg.className}`}>
              {tierCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">Score: {profile.clipperScore}</span>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio as unknown as string}</p>
          )}

          {/* Niche tags */}
          {profile.nicheTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.nicheTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Bergabung sejak{' '}
            {new Date(profile.createdAt as unknown as string).toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Share button */}
        <Button variant="outline" size="sm" onClick={handleShare} className="shrink-0">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              Disalin!
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Bagikan
            </>
          )}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-1 text-center">
          <div className="flex justify-center">
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{formatNumber(profile.stats.totalClips)}</p>
          <p className="text-xs text-muted-foreground">Clips</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1 text-center">
          <div className="flex justify-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{formatNumber(profile.stats.totalViews)}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1 text-center">
          <div className="flex justify-center">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{profile.stats.totalCampaigns}</p>
          <p className="text-xs text-muted-foreground">Campaigns</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1 text-center">
          <div className="flex justify-center">
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">
            {profile.stats.averageRating > 0
              ? profile.stats.averageRating.toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </div>
      </div>

      {/* Recent clips */}
      {profile.recentClips.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Clips Terbaru</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.recentClips.map((clip) => (
              <div
                key={clip.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <p className="text-sm font-medium line-clamp-2">{clip.campaignTitle}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {clip.platform && (
                    <Badge variant="outline" className="capitalize text-xs">
                      {clip.platform as unknown as string}
                    </Badge>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <span>{formatNumber(clip.views)} views</span>
                    <span className="text-primary font-medium">{formatRupiah(clip.earnings)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.recentClips.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clips Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada clip yang disetujui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
