'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrganizationControllerListMyOrganizations,
  useOrganizationControllerGetOrganization,
  useOrganizationControllerCreateOrganization,
  useOrganizationControllerInviteMember,
  useOrganizationControllerUpdateMember,
  useOrganizationControllerRemoveMember,
  useOrganizationControllerGetStats,
  getOrganizationControllerListMyOrganizationsQueryKey,
  getOrganizationControllerGetOrganizationQueryKey,
} from '@/generated/api/organization/organization';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import type { OrganizationResponseDto, OrgMemberResponseDto } from '@/generated/api/model';
import { InviteMemberDtoRole } from '@/generated/api/model/inviteMemberDtoRole';
import { UpdateMemberDtoRole } from '@/generated/api/model/updateMemberDtoRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { CountUp } from '@/components/ui/count-up';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
import {
  Users,
  Plus,
  ChevronLeft,
  Building2,
  Star,
  Layers,
  UserMinus,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Create Organization Form ─────────────────────────────────────────────────

function CreateOrgForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'team' | 'agency'>('team');
  const [bio, setBio] = useState('');

  const { mutate, isPending } = useOrganizationControllerCreateOrganization({
    mutation: {
      onSuccess: () => {
        toast.success('Organisasi berhasil dibuat!');
        onCreated();
      },
      onError: () => {
        toast.error('Gagal membuat organisasi.');
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate({ data: { name: name.trim(), type, bio: bio.trim() || undefined } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Nama Organisasi <span className="text-destructive">*</span></Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Tim Kreatif Kami"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Tipe</Label>
        <div className="flex gap-2">
          {(['team', 'agency'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                type === t
                  ? 'gradient-fill text-white border-transparent'
                  : 'glass text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'team' ? 'Tim' : 'Agensi'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {type === 'team'
            ? 'Tim kecil untuk berkolaborasi dengan beberapa clipper.'
            : 'Agensi untuk mengelola banyak clipper secara profesional.'}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-bio">Bio (opsional)</Label>
        <textarea
          id="org-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ceritakan sedikit tentang tim atau agensi kamu..."
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground resize-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Batal
        </Button>
        <GradientButton type="submit" disabled={isPending || !name.trim()} size="sm">
          {isPending ? 'Membuat...' : 'Buat Organisasi'}
        </GradientButton>
      </div>
    </form>
  );
}

// ─── Invite Member Form ───────────────────────────────────────────────────────

function InviteMemberForm({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<InviteMemberDtoRole>(InviteMemberDtoRole.clipper);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useOrganizationControllerInviteMember({
    mutation: {
      onSuccess: () => {
        toast.success('Undangan berhasil dikirim!');
        queryClient.invalidateQueries({
          queryKey: getOrganizationControllerGetOrganizationQueryKey(orgId),
        });
        setUserId('');
        onClose();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? 'Gagal mengundang anggota.');
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    mutate({ id: orgId, data: { userId: userId.trim(), role } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 glass rounded-xl">
      <h4 className="font-semibold text-sm">Undang Anggota Baru</h4>
      <div className="flex gap-2">
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID anggota..."
          className="flex-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as InviteMemberDtoRole)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={InviteMemberDtoRole.clipper}>Clipper</option>
          <option value={InviteMemberDtoRole.manager}>Manager</option>
          <option value={InviteMemberDtoRole.finance}>Finance</option>
        </select>
        <Button type="submit" size="sm" disabled={isPending || !userId.trim()}>
          Undang
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Batal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Masukkan User ID anggota yang ingin diundang.</p>
    </form>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  orgId,
  isOwner,
  currentUserId,
}: {
  member: OrgMemberResponseDto;
  orgId: string;
  isOwner: boolean;
  currentUserId?: string;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState<UpdateMemberDtoRole>(UpdateMemberDtoRole.clipper);
  const queryClient = useQueryClient();

  const { mutate: updateMember, isPending: updating } = useOrganizationControllerUpdateMember({
    mutation: {
      onSuccess: () => {
        toast.success('Role diperbarui.');
        setEditingRole(false);
        queryClient.invalidateQueries({
          queryKey: getOrganizationControllerGetOrganizationQueryKey(orgId),
        });
      },
      onError: () => toast.error('Gagal memperbarui role.'),
    },
  });

  const { mutate: removeMember, isPending: removing } = useOrganizationControllerRemoveMember({
    mutation: {
      onSuccess: () => {
        toast.success('Anggota dihapus.');
        queryClient.invalidateQueries({
          queryKey: getOrganizationControllerGetOrganizationQueryKey(orgId),
        });
      },
      onError: () => toast.error('Gagal menghapus anggota.'),
    },
  });

  const isCurrentUser = member.userId === currentUserId;
  const isMemberOwner = member.role === 'owner';

  const roleColors: Record<string, string> = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-blue-500/10 text-blue-400',
    member: 'bg-white/10 text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-3 py-3 hover:bg-white/5 rounded-lg px-2 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0 text-primary">
        {member.userName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {member.userName}
          {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(Kamu)</span>}
        </p>
        <p className="text-xs text-muted-foreground">{member.status}</p>
      </div>

      {editingRole ? (
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UpdateMemberDtoRole)}
            className="rounded border border-input bg-background px-2 py-1 text-xs"
          >
            <option value={UpdateMemberDtoRole.manager}>Manager</option>
            <option value={UpdateMemberDtoRole.clipper}>Clipper</option>
            <option value={UpdateMemberDtoRole.finance}>Finance</option>
          </select>
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            disabled={updating}
            onClick={() => updateMember({ id: orgId, memberId: member.id, data: { role: newRole } })}
          >
            Simpan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setEditingRole(false)}
          >
            Batal
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', roleColors[member.role] ?? 'bg-white/10')}>
            {member.role}
          </span>
          {isOwner && !isMemberOwner && (
            <>
              <button
                onClick={() => setEditingRole(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Edit role"
              >
                <UserCog className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => removeMember({ id: orgId, memberId: member.id })}
                disabled={removing}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Hapus anggota"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Org Detail View ──────────────────────────────────────────────────────────

function OrgDetailView({
  org,
  onBack,
  currentUserId,
}: {
  org: OrganizationResponseDto;
  onBack: () => void;
  currentUserId?: string;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const { data: stats } = useOrganizationControllerGetStats(org.id);
  const { data: detail } = useOrganizationControllerGetOrganization(org.id);

  const isOwner = org.ownerId === currentUserId;
  const members = detail?.members ?? org.members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Kembali">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{org.name}</h2>
          <p className="text-sm text-muted-foreground capitalize">{org.type}</p>
        </div>
        <span className="ml-auto glass px-3 py-1 rounded-full text-xs font-medium">
          {org.kybStatus}
        </span>
      </div>

      {org.bio && typeof org.bio === 'string' && (
        <p className="text-sm text-muted-foreground">{org.bio}</p>
      )}

      {stats && (
        <motion.div
          className="grid gap-4 sm:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <GlassCard hover={false} className="p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Anggota</p>
            <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
              <CountUp target={stats.memberCount} />
            </p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Total Pendapatan</p>
            <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
              Rp <CountUp target={stats.totalEarnings ?? 0} />
            </p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Campaign Aktif</p>
            <p className="text-xl font-bold font-[family-name:var(--font-geist-mono)]">
              <CountUp target={stats.activeCampaigns} />
            </p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Rating Rata-rata</p>
            <p className="text-xl font-bold flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {stats.averageRating?.toFixed(1) ?? '—'}
            </p>
          </GlassCard>
        </motion.div>
      )}

      <GlassCard hover={false} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Anggota ({members.length})
          </h3>
          {isOwner && (
            <GradientButton size="sm" onClick={() => setShowInvite(!showInvite)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Undang
            </GradientButton>
          )}
        </div>

        {showInvite && (
          <div className="mb-4">
            <InviteMemberForm orgId={org.id} onClose={() => setShowInvite(false)} />
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada anggota.</p>
        ) : (
          <div>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                orgId={org.id}
                isOwner={isOwner}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Org Card ─────────────────────────────────────────────────────────────────

function OrgCard({
  org,
  onClick,
}: {
  org: OrganizationResponseDto;
  onClick: () => void;
}) {
  return (
    <motion.div variants={fadeUp}>
      <GlassCard onClick={onClick} className="p-5 space-y-3 cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{org.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{org.type}</p>
          </div>
          <span className="glass px-2 py-0.5 rounded-full text-xs shrink-0">
            {org.kybStatus}
          </span>
        </div>

        {org.bio && typeof org.bio === 'string' && (
          <p className="text-xs text-muted-foreground line-clamp-2">{org.bio}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {org.members?.length ?? 0} anggota
          </span>
          {org.nicheTags.length > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {org.nicheTags.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useUserControllerGetProfile();
  const { data: orgs, isLoading } = useOrganizationControllerListMyOrganizations();

  function handleOrgCreated() {
    queryClient.invalidateQueries({
      queryKey: getOrganizationControllerListMyOrganizationsQueryKey(),
    });
    setView('list');
  }

  if (view === 'create') {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('list')} aria-label="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Buat Organisasi</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Buat tim atau agensi untuk berkolaborasi.
            </p>
          </div>
        </div>
        <GlassCard hover={false}>
          <CreateOrgForm onCancel={() => setView('list')} onCreated={handleOrgCreated} />
        </GlassCard>
      </div>
    );
  }

  if (view === 'detail' && selectedOrg) {
    return (
      <div className="max-w-2xl">
        <OrgDetailView
          org={selectedOrg}
          onBack={() => { setSelectedOrg(null); setView('list'); }}
          currentUserId={profile?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tim & Agensi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola tim dan agensi yang kamu ikuti atau miliki.
          </p>
        </div>
        <GradientButton onClick={() => setView('create')} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Buat Organisasi
        </GradientButton>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i} hover={false} className="p-5 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </GlassCard>
          ))}
        </div>
      ) : !orgs || orgs.length === 0 ? (
        <GlassCard hover={false} className="p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Belum ada organisasi.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Buat tim atau agensi untuk mulai berkolaborasi.
          </p>
          <GradientButton className="mt-4" onClick={() => setView('create')} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Organisasi
          </GradientButton>
        </GlassCard>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {orgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              onClick={() => { setSelectedOrg(org); setView('detail'); }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
