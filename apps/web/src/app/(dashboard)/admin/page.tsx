'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Megaphone, Scissors, TrendingUp, Wallet, ShieldCheck } from 'lucide-react';
import { useAdminControllerGetStats } from '@/generated/api/admin/admin';
import { GlassCard } from '@/components/ui/glass-card';
import { CountUp } from '@/components/ui/count-up';
import { Sparkline } from '@/components/ui/sparkline';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { formatRupiah } from '@/lib/format';

const DUMMY_SPARKLINE = [3, 5, 4, 7, 6, 8, 9];

function StatCard({
  title,
  value,
  numericValue,
  icon: Icon,
  sub,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
}: {
  title: string;
  value?: string | number;
  numericValue?: number;
  icon: React.ElementType;
  sub?: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <GlassCard hover={false} className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        {numericValue !== undefined ? (
          <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)]">
            <CountUp target={numericValue} />
          </p>
        ) : (
          <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)]">{value}</p>
        )}
        <div className="flex items-end justify-between">
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          <Sparkline data={DUMMY_SPARKLINE} width={64} height={24} className="ml-auto" />
        </div>
      </GlassCard>
    </motion.div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <GlassCard key={i} hover={false} className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24" />
        </GlassCard>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminControllerGetStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
        <p className="text-muted-foreground">Overview platform Duta</p>
      </div>

      {/* Stats */}
      {isLoading || !stats ? (
        <StatsSkeleton />
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <StatCard
            title="Total Users"
            numericValue={stats.totalUsers}
            icon={Users}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
          />
          <StatCard
            title="Clippers"
            numericValue={stats.totalClippers}
            icon={Scissors}
            sub={`${stats.totalOwners} owners`}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-400"
          />
          <StatCard
            title="Active Campaigns"
            numericValue={stats.activeCampaigns}
            icon={Megaphone}
            sub={`${stats.totalCampaigns} total`}
            iconBg="bg-green-500/10"
            iconColor="text-green-400"
          />
          <StatCard
            title="Total Clips"
            numericValue={stats.totalClips}
            icon={TrendingUp}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-400"
          />
          <StatCard
            title="GMV"
            value={formatRupiah(stats.gmv)}
            icon={Wallet}
            sub="Gross Merchandise Value"
            iconBg="bg-yellow-500/10"
            iconColor="text-yellow-400"
          />
          <StatCard
            title="Revenue"
            value={formatRupiah(stats.revenue)}
            icon={ShieldCheck}
            sub="Platform fee"
            iconBg="bg-primary/10"
            iconColor="text-primary"
          />
        </motion.div>
      )}

      {/* Quick links */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Manajemen</h3>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Kelola Users
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/campaigns">
              <Megaphone className="h-4 w-4 mr-2" />
              Kelola Campaigns
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
