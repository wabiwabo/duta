'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { CheckCircle2, Circle, X, PartyPopper, ChevronRight } from 'lucide-react';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import { useClipControllerListMyClips } from '@/generated/api/clip/clip';
import { useCampaignControllerListCampaigns } from '@/generated/api/campaign/campaign';
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'duta_onboarding_dismissed';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  optional?: boolean;
  completed: boolean;
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group',
        item.completed ? 'opacity-60' : 'hover:bg-muted',
      )}
    >
      <div className="shrink-0">
        {item.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', item.completed && 'line-through text-muted-foreground')}>
          {item.label}
          {item.optional && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(opsional)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
      {!item.completed && (
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </Link>
  );
}

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: profile, isLoading: profileLoading } = useUserControllerGetProfile();
  const isClipper = profile?.role === UserProfileDtoRole.clipper;
  const isOwner =
    profile?.role === UserProfileDtoRole.owner ||
    profile?.role === UserProfileDtoRole.admin;

  const { data: clipsData, isLoading: clipsLoading } = useClipControllerListMyClips(
    { limit: 1 },
    { query: { enabled: isClipper } },
  );
  const { data: campaignsData, isLoading: campaignsLoading } =
    useCampaignControllerListCampaigns(
      { limit: 1 },
      { query: { enabled: isOwner } },
    );

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!mounted || profileLoading || clipsLoading || campaignsLoading || !profile) {
    return null;
  }

  if (dismissed) return null;

  // Check completion for each item
  const profileComplete = !!profile.name && !!profile.bio;
  const nicheComplete = Array.isArray(profile.nicheTags) && profile.nicheTags.length > 0;
  const avatarComplete = !!profile.avatarUrl;
  const activityComplete = isClipper
    ? (clipsData?.data?.length ?? 0) > 0
    : (campaignsData?.data?.length ?? 0) > 0;

  const items: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Lengkapi profil',
      description: 'Isi nama dan bio kamu',
      href: '/profile',
      completed: profileComplete,
    },
    {
      id: 'niche',
      label: 'Tambah niche tags',
      description: 'Pilih niche yang sesuai dengan konten kamu',
      href: '/profile',
      completed: nicheComplete,
    },
    {
      id: 'avatar',
      label: 'Atur avatar',
      description: 'Upload foto profil kamu',
      href: '/profile',
      optional: true,
      completed: avatarComplete,
    },
    {
      id: 'activity',
      label: isClipper ? 'Gabung campaign pertama' : 'Buat campaign pertama',
      description: isClipper
        ? 'Temukan campaign dan kirim clip pertama kamu'
        : 'Buat campaign dan mulai cari clipper',
      href: isClipper ? '/campaigns' : '/campaigns/new',
      completed: activityComplete,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;
  const progress = Math.round((completedCount / items.length) * 100);

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <GlassCard hover={false} className="relative p-0">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 rounded-sm opacity-60 hover:opacity-100 transition-opacity z-10"
        aria-label="Tutup checklist"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pb-3 pr-10 px-6 pt-6">
        <div className="flex items-center gap-2">
          {allDone ? (
            <PartyPopper className="h-5 w-5 text-yellow-500" />
          ) : null}
          <p className="text-base font-semibold">
            {allDone ? 'Setup selesai!' : 'Setup akun kamu'}
          </p>
        </div>

        {allDone ? (
          <p className="text-sm text-muted-foreground mt-1">
            Kamu sudah menyelesaikan semua langkah. Selamat bergabung di Duta!
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount} dari {items.length} langkah selesai
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full gradient-fill transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="pb-4 px-6 space-y-0.5">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}

        {allDone && (
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={handleDismiss} className="w-full">
              Sembunyikan
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
