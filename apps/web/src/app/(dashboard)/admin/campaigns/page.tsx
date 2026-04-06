'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useAdminControllerListCampaigns } from '@/generated/api/admin/admin';
import { AdminControllerListCampaignsStatus } from '@/generated/api/model/adminControllerListCampaignsStatus';
import type { AdminCampaignResponseDto } from '@/generated/api/model/adminCampaignResponseDto';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusPill } from '@/components/ui/status-pill';

const PAGE_SIZE = 20;

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const TYPE_LABEL: Record<string, string> = {
  ugc: 'UGC',
  performance: 'Performance',
};

function CampaignRow({ campaign }: { campaign: AdminCampaignResponseDto }) {
  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  return (
    <tr className="border-b border-white/5 transition-colors hover:bg-white/5">
      <td className="p-3">
        <p className="font-medium text-sm truncate max-w-[200px]">{campaign.title}</p>
      </td>
      <td className="p-3">
        <span className="glass px-2 py-0.5 rounded-full text-xs capitalize">
          {TYPE_LABEL[campaign.type] ?? campaign.type}
        </span>
      </td>
      <td className="p-3">
        <StatusPill status={campaign.status} />
      </td>
      <td className="p-3 text-sm">
        <div>
          <p className="font-medium font-[family-name:var(--font-geist-mono)]">{formatRupiah(campaign.budgetTotal)}</p>
          <div className="mt-1 h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full gradient-fill rounded-full"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{budgetPct}% terpakai</p>
        </div>
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        {new Date(campaign.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="p-3">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
          <Link href={`/campaigns/${campaign.id}`}>
            <ExternalLink className="h-3 w-3" />
            Detail
          </Link>
        </Button>
      </td>
    </tr>
  );
}

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');

  const statusParam =
    status !== 'all'
      ? (status as AdminControllerListCampaignsStatus)
      : undefined;

  const { data, isLoading } = useAdminControllerListCampaigns({
    page,
    limit: PAGE_SIZE,
    status: statusParam,
  });

  const campaigns: AdminCampaignResponseDto[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Campaigns</h2>
          <p className="text-muted-foreground text-sm">{total} campaign terdaftar</p>
        </div>

        {/* Filter */}
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={AdminControllerListCampaignsStatus.draft}>Draft</SelectItem>
            <SelectItem value={AdminControllerListCampaignsStatus.active}>Aktif</SelectItem>
            <SelectItem value={AdminControllerListCampaignsStatus.paused}>Dijeda</SelectItem>
            <SelectItem value={AdminControllerListCampaignsStatus.completed}>Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GlassCard hover={false} className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-base font-semibold">Daftar Campaigns</h3>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Tidak ada campaign ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-3 text-left font-medium text-muted-foreground">Judul</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Tipe</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Budget</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Dibuat</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
