'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { CampaignCard } from '@/components/campaign-card';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
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
    <div className="glass rounded-xl p-4 space-y-3 shimmer">
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
        {/* Desktop "Buat Campaign" button */}
        <Button asChild size="sm" className="hidden sm:flex">
          <Link href="/campaigns/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Campaign
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Glass search input */}
        <div className="relative max-w-md glass rounded-lg focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari campaign atau creator..."
            className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => handleTypeFilter(f.value)}
                className={
                  typeFilter === f.value
                    ? 'h-7 text-xs px-3 rounded-md gradient-fill text-white font-medium transition-all'
                    : 'h-7 text-xs px-3 rounded-md glass text-muted-foreground hover:text-foreground border border-border/60 transition-all'
                }
              >
                {f.label}
              </button>
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
        <GlassCard hover={false} className="p-8 text-center">
          <p className="text-destructive font-medium">Gagal memuat campaigns.</p>
          <p className="text-sm text-muted-foreground mt-1">Coba refresh halaman ini.</p>
        </GlassCard>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <GlassCard hover={false} className="p-12 text-center">
          <p className="text-muted-foreground font-medium">Tidak ada campaign ditemukan.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || typeFilter
              ? 'Coba ubah filter atau kata kunci pencarian.'
              : 'Belum ada campaign aktif saat ini.'}
          </p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredCampaigns.map((campaign) => (
            <motion.div key={campaign.id} variants={fadeUp}>
              <CampaignCard campaign={campaign} />
            </motion.div>
          ))}
        </motion.div>
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

      {/* FAB — Buat Campaign (mobile) */}
      <Link
        href="/campaigns/new"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full gradient-fill text-white shadow-lg glow-pulse sm:hidden"
        aria-label="Buat Campaign"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
