'use client';

import { useUserControllerGetProfile, useUserControllerUpdateProfile } from '@/generated/api/user/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { ShimmerBadge } from '@/components/ui/shimmer-badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: profile, isLoading } = useUserControllerGetProfile();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBio((profile.bio as unknown as string) ?? '');
      setTags(
        Array.isArray(profile.nicheTags)
          ? (profile.nicheTags as string[]).join(', ')
          : '',
      );
    }
  }, [profile]);

  const { mutate: updateProfile, isPending } = useUserControllerUpdateProfile
    ? useUserControllerUpdateProfile({
        mutation: {
          onSuccess: () => toast.success('Profil berhasil disimpan!'),
          onError: () => toast.error('Gagal menyimpan profil.'),
        },
      })
    : { mutate: () => {}, isPending: false };

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({
      data: {
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        nicheTags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
  }

  const tier = (profile as unknown as Record<string, unknown>)?.clipperTier as string | undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Kelola profil dan informasi akunmu.</p>
      </div>

      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold">Informasi Profil</h3>
          {tier && <ShimmerBadge tier={tier} />}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-28" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                placeholder="Ceritakan tentang dirimu"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Niche Tags</Label>
              <Input
                id="tags"
                placeholder="gaming, tech, lifestyle"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma.</p>
            </div>
            <GradientButton type="submit" disabled={isPending} size="sm">
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </GradientButton>
          </form>
        )}
      </GlassCard>

      {profile && (
        <GlassCard hover={false} className="space-y-3">
          <h3 className="text-base font-semibold">Informasi Akun</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{profile.role}</span>
            </div>
            {tier && (
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Tier</span>
                <ShimmerBadge tier={tier} />
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
