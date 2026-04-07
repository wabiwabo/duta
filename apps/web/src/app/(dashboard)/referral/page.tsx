'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Gift, Copy, Share2, Users, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useReferralControllerGetStats,
  useReferralControllerGenerateCode,
  useReferralControllerApplyReferral,
  getReferralControllerGetStatsQueryKey,
} from '@/generated/api/referral/referral';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { CountUp } from '@/components/ui/count-up';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { formatRupiah } from '@/lib/format';

export default function ReferralPage() {
  const queryClient = useQueryClient();
  const [applyCode, setApplyCode] = useState('');

  const { data: stats, isLoading } = useReferralControllerGetStats();

  const { mutate: generateCode, isPending: isGenerating } = useReferralControllerGenerateCode({
    mutation: {
      onSuccess: () => {
        toast.success('Kode referral berhasil dibuat!');
        queryClient.invalidateQueries({ queryKey: getReferralControllerGetStatsQueryKey() });
      },
      onError: () => {
        toast.error('Gagal membuat kode referral. Coba lagi.');
      },
    },
  });

  const { mutate: applyReferral, isPending: isApplying } = useReferralControllerApplyReferral({
    mutation: {
      onSuccess: () => {
        toast.success('Kode referral berhasil digunakan!');
        setApplyCode('');
        queryClient.invalidateQueries({ queryKey: getReferralControllerGetStatsQueryKey() });
      },
      onError: () => {
        toast.error('Kode referral tidak valid atau sudah digunakan.');
      },
    },
  });

  const referrals = stats?.referrals ?? [];
  const totalReferred = stats?.totalReferred ?? 0;
  const totalBonus = stats?.totalBonus ?? 0;

  // We check if there's any data in stats — the API returns code via generate, not in stats
  // so we use a local state to track the generated code if stats doesn't carry it
  const [localCode, setLocalCode] = useState<string | null>(null);

  function handleGenerate() {
    generateCode(undefined, {
      onSuccess: (data) => {
        if (data?.code) setLocalCode(data.code);
      },
    });
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Kode disalin ke clipboard!');
    });
  }

  function handleShare(code: string) {
    const shareData = {
      title: 'Duta — Platform Clip Marketing',
      text: `Gabung di Duta pakai kode referral aku: ${code}`,
      url: typeof window !== 'undefined' ? window.location.origin : '',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopy(code);
    }
  }

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!applyCode.trim()) {
      toast.error('Masukkan kode referral terlebih dahulu.');
      return;
    }
    applyReferral({ data: { code: applyCode.trim() } });
  }

  const displayCode = localCode;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Kamu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajak teman bergabung di Duta dan dapatkan bonus bersama.
        </p>
      </div>

      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Referral Code Card */}
        <GlassCard hover={false} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            Kode Referral
          </div>

          {isLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : displayCode ? (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-[family-name:var(--font-geist-mono)] text-2xl font-bold tracking-widest text-primary gradient-text select-all">
                  {displayCode}
                </span>
                <div className="flex gap-2">
                  <GradientButton
                    variant="glass"
                    size="sm"
                    onClick={() => handleCopy(displayCode)}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Salin
                  </GradientButton>
                  <GradientButton
                    variant="glass"
                    size="sm"
                    onClick={() => handleShare(displayCode)}
                    className="flex items-center gap-1.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Bagikan
                  </GradientButton>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Bagikan kode ini ke teman-temanmu untuk mendapatkan bonus referral.
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Kamu belum memiliki kode referral. Generate sekarang untuk mulai mengajak teman!
              </p>
              <GradientButton
                onClick={handleGenerate}
                disabled={isGenerating}
                size="sm"
                pulse
              >
                {isGenerating ? 'Membuat kode...' : 'Generate Kode'}
              </GradientButton>
            </div>
          )}
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard hover={false} className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-400" />
              </div>
              Total Referred
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)]">
                <CountUp target={totalReferred} />
              </p>
            )}
          </GlassCard>

          <GlassCard hover={false} className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Coins className="h-3.5 w-3.5 text-green-400" />
              </div>
              Total Bonus
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-green-400 font-[family-name:var(--font-geist-mono)]">
                <CountUp
                  target={totalBonus}
                  formatFn={(n) => formatRupiah(n)}
                />
              </p>
            )}
          </GlassCard>
        </div>

        {/* Referral History */}
        <motion.div variants={fadeUp} className="space-y-3">
          <h2 className="text-base font-semibold">Riwayat Referral</h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <GlassCard hover={false} className="p-10 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat referral.</p>
            </GlassCard>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pengguna</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bonus</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {ref.refereeId?.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {ref.createdAt
                          ? new Date(ref.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap font-[family-name:var(--font-geist-mono)]">
                        {ref.bonusAmount ? formatRupiah(ref.bonusAmount) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            ref.bonusPaid
                              ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-400'
                              : 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-400'
                          }
                        >
                          {ref.bonusPaid ? 'Dibayar' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Apply Referral Code */}
        <GlassCard hover={false} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            Punya Kode Referral?
          </div>
          <p className="text-sm text-muted-foreground">
            Masukkan kode referral dari teman untuk mendapatkan bonus bergabung.
          </p>
          <form onSubmit={handleApply} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Masukkan kode referral"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              className="max-w-xs font-[family-name:var(--font-geist-mono)] tracking-widest"
            />
            <GradientButton type="submit" disabled={isApplying} size="sm">
              {isApplying ? 'Memproses...' : 'Gunakan'}
            </GradientButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
