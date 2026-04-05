'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const PAGE_SIZE = 20;

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  active: { label: 'Aktif', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  paused: { label: 'Dijeda', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Selesai', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

const TYPE_LABEL: Record<string, string> = {
  ugc: 'UGC',
  performance: 'Performance',
};

function CampaignRow({ campaign }: { campaign: AdminCampaignResponseDto }) {
  const status = STATUS_CONFIG[campaign.status] ?? { label: campaign.status, className: 'bg-muted text-muted-foreground' };
  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-3">
        <p className="font-medium text-sm truncate max-w-[200px]">{campaign.title}</p>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="text-xs capitalize">
          {TYPE_LABEL[campaign.type] ?? campaign.type}
        </Badge>
      </td>
      <td className="p-3">
        <span
          className={[
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            status.className,
          ].join(' ')}
        >
          {status.label}
        </span>
      </td>
      <td className="p-3 text-sm">
        <div>
          <p className="font-medium">{formatRupiah(campaign.budgetTotal)}</p>
          <p className="text-xs text-muted-foreground">{budgetPct}% terpakai</p>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                  <tr className="border-b bg-muted/50">
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
        </CardContent>
      </Card>

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
