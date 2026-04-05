'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Megaphone, Scissors, TrendingUp, Wallet, ShieldCheck } from 'lucide-react';
import { useAdminControllerGetStats } from '@/generated/api/admin/admin';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
          <StatCard
            title="Clippers"
            value={stats.totalClippers}
            icon={Scissors}
            sub={`${stats.totalOwners} owners`}
          />
          <StatCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            icon={Megaphone}
            sub={`${stats.totalCampaigns} total`}
          />
          <StatCard title="Total Clips" value={stats.totalClips} icon={TrendingUp} />
          <StatCard
            title="GMV"
            value={formatRupiah(stats.gmv)}
            icon={Wallet}
            sub="Gross Merchandise Value"
          />
          <StatCard
            title="Revenue"
            value={formatRupiah(stats.revenue)}
            icon={ShieldCheck}
            sub="Platform fee"
          />
        </div>
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
