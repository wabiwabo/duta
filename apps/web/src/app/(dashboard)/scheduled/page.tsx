'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  useSchedulingControllerListScheduled,
  useSchedulingControllerCancelPost,
  getSchedulingControllerListScheduledQueryKey,
} from '@/generated/api/scheduling/scheduling';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusPill } from '@/components/ui/status-pill';
import { GradientButton } from '@/components/ui/gradient-button';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, fadeUp } from '@/lib/motion';

interface ScheduledPost {
  id: string;
  clipId?: string;
  clipTitle?: string;
  platform?: string;
  scheduledAt?: string;
  status?: string;
  clip?: { title?: string };
}

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  reels: 'Reels',
  shorts: 'Shorts',
};

export default function ScheduledPage() {
  const queryClient = useQueryClient();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const { data: rawData, isLoading } = useSchedulingControllerListScheduled();

  const posts: ScheduledPost[] = Array.isArray(rawData) ? (rawData as ScheduledPost[]) : [];

  const { mutate: cancelPost } = useSchedulingControllerCancelPost({
    mutation: {
      onSuccess: () => {
        toast.success('Jadwal posting berhasil dibatalkan.');
        setCancelingId(null);
        queryClient.invalidateQueries({
          queryKey: getSchedulingControllerListScheduledQueryKey(),
        });
      },
      onError: () => {
        toast.error('Gagal membatalkan jadwal. Coba lagi.');
        setCancelingId(null);
      },
    },
  });

  function handleCancel(id: string) {
    setCancelingId(id);
    cancelPost({ id });
  }

  function formatScheduledAt(dateStr?: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getClipTitle(post: ScheduledPost): string {
    return post.clip?.title ?? post.clipTitle ?? post.clipId ?? 'Clip';
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jadwal Posting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola jadwal posting clip kamu di berbagai platform.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <GlassCard hover={false} className="p-12 text-center space-y-3">
          <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Belum ada jadwal posting.</p>
          <Link
            href="/campaigns"
            className="inline-block text-sm text-primary hover:underline"
          >
            Lihat campaigns untuk menjadwalkan posting
          </Link>
        </GlassCard>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={fadeUp}>
              <GlassCard hover={false} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-medium truncate">
                      Clip: &ldquo;{getClipTitle(post)}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        Platform:{' '}
                        <span className="text-foreground font-medium">
                          {PLATFORM_LABEL[post.platform?.toLowerCase() ?? ''] ?? post.platform ?? '-'}
                        </span>
                      </span>
                      <span>
                        Jadwal:{' '}
                        <span className="text-foreground font-medium">
                          {formatScheduledAt(post.scheduledAt)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <StatusPill status={post.status ?? 'pending'} />
                    </div>
                  </div>

                  {post.status === 'pending' && (
                    <GradientButton
                      variant="glass"
                      size="sm"
                      disabled={cancelingId === post.id}
                      onClick={() => handleCancel(post.id)}
                      className="flex items-center gap-1.5 flex-shrink-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {cancelingId === post.id ? 'Membatalkan...' : 'Batalkan'}
                    </GradientButton>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
