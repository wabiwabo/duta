'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { GlassCard } from '@/components/ui/glass-card';
import { CountUp } from '@/components/ui/count-up';
import { ShimmerBadge } from '@/components/ui/shimmer-badge';
import { StatusPill } from '@/components/ui/status-pill';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { formatRupiah } from '@/lib/format';

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

      {/* Profile hero */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-green-600/20 pointer-events-none" />
        <GlassCard hover={false} className="relative">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar with glow ring */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-green-500 blur-md opacity-50 scale-110" />
              <Avatar className="relative h-20 w-20 ring-2 ring-white/20">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.name} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-purple-500 to-green-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                <ShimmerBadge tier={profile.clipperTier} />
                <span className="text-xs text-muted-foreground">Score: {profile.clipperScore}</span>
              </div>

              {profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              )}

              {/* Niche tags */}
              {profile.nicheTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.nicheTags.map((tag) => (
                    <span key={tag} className="glass px-2.5 py-0.5 rounded-full text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Bergabung sejak{' '}
                {new Date(profile.createdAt).toLocaleDateString('id-ID', {
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
        </GlassCard>
      </div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <GlassCard hover={false} className="p-4 space-y-1 text-center">
          <div className="flex justify-center mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Video className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
            <CountUp target={profile.stats.totalClips} />
          </p>
          <p className="text-xs text-muted-foreground">Clips</p>
        </GlassCard>

        <GlassCard hover={false} className="p-4 space-y-1 text-center">
          <div className="flex justify-center mb-1">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
            <CountUp target={profile.stats.totalViews} />
          </p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </GlassCard>

        <GlassCard hover={false} className="p-4 space-y-1 text-center">
          <div className="flex justify-center mb-1">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
            <CountUp target={profile.stats.totalCampaigns} />
          </p>
          <p className="text-xs text-muted-foreground">Campaigns</p>
        </GlassCard>

        <GlassCard hover={false} className="p-4 space-y-1 text-center">
          <div className="flex justify-center mb-1">
            <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
            {profile.stats.averageRating > 0
              ? profile.stats.averageRating.toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </GlassCard>
      </motion.div>

      {/* Recent clips */}
      {profile.recentClips.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Clips Terbaru</h2>
          <motion.div
            className="grid gap-3 sm:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {profile.recentClips.map((clip) => (
              <motion.div key={clip.id} variants={fadeUp}>
                <GlassCard className="p-4 space-y-2">
                  <p className="text-sm font-medium line-clamp-2">{clip.campaignTitle}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                    {clip.platform && (
                      <StatusPill
                        status="active"
                        label={clip.platform ?? ''}
                        className="capitalize"
                      />
                    )}
                    <div className="flex gap-3 ml-auto">
                      <span>{clip.views.toLocaleString('id-ID')} views</span>
                      <span className="text-green-400 font-medium font-[family-name:var(--font-geist-mono)]">
                        {formatRupiah(clip.earnings)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </section>
      ) : (
        <GlassCard hover={false} className="text-center">
          <h3 className="text-base font-semibold mb-2">Clips Terbaru</h3>
          <p className="text-sm text-muted-foreground py-4">
            Belum ada clip yang disetujui.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
