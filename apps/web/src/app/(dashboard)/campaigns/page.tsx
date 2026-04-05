'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignCard } from '@/components/campaign-card';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCampaignControllerListCampaigns } from '@/generated/api/campaign/campaign';
import type {
  CampaignControllerListCampaignsType,
  CampaignControllerListCampaignsSortBy,
} from '@/generated/api/model';

const TYPE_FILTERS: { label: string; value: CampaignControllerListCampaignsType | undefined }[] = [
  { label: 'Semua', value: undefined },
  { label: 'Bounty', value: 'bounty' },
  { label: 'Gig', value: 'gig' },
  { label: 'Podcast', value: 'podcast' },
];

const SORT_OPTIONS: { label: string; value: CampaignControllerListCampaignsSortBy }[] = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Rate Tertinggi', value: 'rate' },
  { label: 'Budget Terbesar', value: 'budget' },
];

const PAGE_LIMIT = 12;

function CampaignCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CampaignControllerListCampaignsType | undefined>(undefined);
  const [sortBy, setSortBy] = useState<CampaignControllerListCampaignsSortBy>('newest');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  const handleTypeFilter = useCallback((value: CampaignControllerListCampaignsType | undefined) => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const handleSortBy = useCallback((value: CampaignControllerListCampaignsSortBy) => {
    setSortBy(value);
    setPage(1);
  }, []);

  const { data, isLoading, isError } = useCampaignControllerListCampaigns({
    status: 'active',
    type: typeFilter,
    sortBy,
    page,
    limit: PAGE_LIMIT,
  });

  const campaigns = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // Client-side filter by search query (since the campaign list API doesn't have a q param)
  const filteredCampaigns = debouncedSearch
    ? campaigns.filter(
        (c) =>
          c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.owner.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : campaigns;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground text-sm">Temukan campaign yang sesuai untukmu.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/campaigns/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Campaign
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari campaign atau creator..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {TYPE_FILTERS.map((f) => (
              <Button
                key={f.label}
                variant={typeFilter === f.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleTypeFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Urut:</span>
            {SORT_OPTIONS.map((s) => (
              <Button
                key={s.value}
                variant={sortBy === s.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleSortBy(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          {debouncedSearch
            ? `${filteredCampaigns.length} hasil untuk "${debouncedSearch}"`
            : `${total} campaign ditemukan`}
        </p>
      )}

      {/* Campaign Grid */}
      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive font-medium">Gagal memuat campaigns.</p>
          <p className="text-sm text-muted-foreground mt-1">Coba refresh halaman ini.</p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground font-medium">Tidak ada campaign ditemukan.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || typeFilter
              ? 'Coba ubah filter atau kata kunci pencarian.'
              : 'Belum ada campaign aktif saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !debouncedSearch && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
