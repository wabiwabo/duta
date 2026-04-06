'use client';

import { useUserControllerGetProfile } from '@/generated/api/user/user';
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';
import {
  useAnalyticsControllerGetCreatorAnalytics,
  useAnalyticsControllerGetClipperAnalytics,
  useAnalyticsControllerGetPlatformAnalytics,
} from '@/generated/api/analytics/analytics';
import type { CreatorAnalyticsDto, ClipperAnalyticsDto, PlatformAnalyticsDto } from '@/generated/api/model';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Users, Layers, Award, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { CountUp } from '@/components/ui/count-up';
import { ShimmerBadge } from '@/components/ui/shimmer-badge';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  numericValue,
  sub,
  icon: Icon,
  isRupiah,
}: {
  label: string;
  value?: string | number;
  numericValue?: number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isRupiah?: boolean;
}) {
  return (
    <GlassCard hover={false} className="p-5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      {numericValue !== undefined ? (
        <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)]">
          {isRupiah && 'Rp '}
          <CountUp target={numericValue} />
        </p>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </GlassCard>
  );
}

function StatSkeleton() {
  return (
    <GlassCard hover={false} className="p-5 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-24" />
    </GlassCard>
  );
}

// ─── Trend Table ─────────────────────────────────────────────────────────────

function TrendTable({
  title,
  data,
  valueLabel,
  formatter,
}: {
  title: string;
  data: { date: string; value: number }[];
  valueLabel: string;
  formatter: (v: number) => string;
}) {
  const recent = data.slice(-7);
  const maxVal = Math.max(...recent.map((d) => d.value), 1);

  return (
    <GlassCard hover={false} className="p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {recent.map((d) => (
          <div key={d.date} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{d.date.slice(5)}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full gradient-fill rounded-full transition-all"
                style={{ width: `${(d.value / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium w-24 text-right shrink-0">
              {d.value > 0 ? formatter(d.value) : '—'}
            </span>
          </div>
        ))}
        {recent.every((d) => d.value === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{valueLabel} · 7 hari terakhir</p>
    </GlassCard>
  );
}

// ─── Niche List ───────────────────────────────────────────────────────────────

function NicheList({ title, items }: { title: string; items: { niche: string; count: number }[] }) {
  return (
    <GlassCard hover={false} className="p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.niche} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
              <span className="flex-1 text-sm font-medium capitalize">{item.niche}</span>
              <span className="text-xs text-muted-foreground">{item.count.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ─── Creator View ─────────────────────────────────────────────────────────────

function CreatorAnalyticsView({ data }: { data: CreatorAnalyticsDto }) {
  return (
    <div className="space-y-6">
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <StatCard label="Total Views" numericValue={data.totalViews} icon={TrendingUp} />
        <StatCard label="Total GMV" numericValue={data.totalGmv} isRupiah icon={BarChart3} />
        <StatCard label="Campaign Aktif" numericValue={data.activeCampaigns} icon={Layers} />
        <StatCard label="Total Klip" numericValue={data.totalClips} icon={Activity} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendTable
          title="Views per Hari (30 Hari)"
          data={data.viewsTrend}
          valueLabel="views"
          formatter={(v) => `${v.toLocaleString('id-ID')} views`}
        />
        <NicheList title="Top Niche" items={data.topNiches} />
      </div>

      {data.topCampaigns.length > 0 && (
        <GlassCard hover={false} className="p-5">
          <h3 className="font-semibold mb-4">Top Campaign berdasarkan GMV</h3>
          <div className="divide-y divide-white/5">
            {data.topCampaigns.map((c, i) => (
              <div key={c.id} className="py-3 flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.clipsCount} klip</p>
                </div>
                <span className="text-sm font-semibold shrink-0 font-[family-name:var(--font-geist-mono)]">
                  Rp {c.gmv.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Clipper View ─────────────────────────────────────────────────────────────

function ClipperAnalyticsView({ data }: { data: ClipperAnalyticsDto }) {
  return (
    <div className="space-y-6">
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <StatCard label="Total Pendapatan" numericValue={data.totalEarnings} isRupiah icon={TrendingUp} />
        <StatCard label="Total Views" numericValue={data.totalViews} icon={BarChart3} />
        <StatCard
          label="Klip Disetujui"
          value={`${data.approvedClips} / ${data.totalClips}`}
          sub="Disetujui / Total"
          icon={Activity}
        />
        <GlassCard hover={false} className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tier</p>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-primary" />
            </div>
          </div>
          <ShimmerBadge tier={data.currentTier} />
          <p className="text-xs text-muted-foreground">Score: {data.clipperScore}</p>
        </GlassCard>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendTable
          title="Pendapatan per Hari (30 Hari)"
          data={data.earningsTrend}
          valueLabel="pendapatan"
          formatter={(v) => `Rp ${v.toLocaleString('id-ID')}`}
        />
        <NicheList title="Top Niche" items={data.topNiches} />
      </div>

      {data.topPlatforms.length > 0 && (
        <GlassCard hover={false} className="p-5">
          <h3 className="font-semibold mb-4">Platform Teratas</h3>
          <div className="space-y-2">
            {data.topPlatforms.map((p, i) => (
              <div key={p.niche} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="flex-1 text-sm font-medium capitalize">{p.niche}</span>
                <span className="text-xs text-muted-foreground">{p.count} klip</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Platform View ────────────────────────────────────────────────────────────

function PlatformAnalyticsView({ data }: { data: PlatformAnalyticsDto }) {
  return (
    <div className="space-y-6">
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <StatCard label="Campaign Aktif" numericValue={data.activeCampaigns} icon={Layers} />
        <StatCard label="Total Clipper" numericValue={data.totalClippers} icon={Users} />
        <StatCard
          label="Rasio Supply/Demand"
          value={`${data.supplyDemandRatio}x`}
          sub="Clipper per campaign aktif"
          icon={BarChart3}
        />
        <StatCard label="Klip (30 Hari)" numericValue={data.recentClipsCount} icon={Activity} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NicheList title="Trending Niche" items={data.trendingNiches} />

        <GlassCard hover={false} className="p-5">
          <h3 className="font-semibold mb-4">Rate Rata-rata berdasarkan Tipe</h3>
          {data.avgRatesByType.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
          ) : (
            <div className="divide-y divide-white/5">
              {data.avgRatesByType.map((r) => (
                <div key={r.type} className="py-3 flex items-center gap-4">
                  <span className="flex-1 text-sm font-medium capitalize">{r.type}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-[family-name:var(--font-geist-mono)]">
                      {r.avgRate > 0 ? `Rp ${r.avgRate.toLocaleString('id-ID')}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">per 1K views · {r.campaignCount} campaign</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: profile, isLoading: profileLoading } = useUserControllerGetProfile();
  const isCreator = profile?.role === UserProfileDtoRole.owner;
  const isClipper = profile?.role === UserProfileDtoRole.clipper;
  const isAdmin = profile?.role === UserProfileDtoRole.admin;

  const { data: creatorData, isLoading: creatorLoading } = useAnalyticsControllerGetCreatorAnalytics({
    query: { enabled: isCreator },
  });
  const { data: clipperData, isLoading: clipperLoading } = useAnalyticsControllerGetClipperAnalytics({
    query: { enabled: isClipper },
  });
  const { data: platformData, isLoading: platformLoading } = useAnalyticsControllerGetPlatformAnalytics({
    query: { enabled: isAdmin || (!isCreator && !isClipper && !profileLoading) },
  });

  const isLoading = profileLoading || creatorLoading || clipperLoading || platformLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analitik</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isCreator
            ? 'Performa campaign dan konten kamu.'
            : isClipper
            ? 'Pendapatan dan performa klip kamu.'
            : 'Statistik platform Duta secara keseluruhan.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : isCreator && creatorData ? (
        <CreatorAnalyticsView data={creatorData} />
      ) : isClipper && clipperData ? (
        <ClipperAnalyticsView data={clipperData} />
      ) : platformData ? (
        <PlatformAnalyticsView data={platformData} />
      ) : (
        <GlassCard hover={false} className="p-12 text-center">
          <p className="text-muted-foreground">Belum ada data analitik.</p>
        </GlassCard>
      )}
    </div>
  );
}
