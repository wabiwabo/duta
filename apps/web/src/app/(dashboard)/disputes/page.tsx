'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus } from 'lucide-react';
import {
  useDisputeControllerListDisputes,
  useDisputeControllerCreateDispute,
  getDisputeControllerListDisputesQueryKey,
} from '@/generated/api/dispute/dispute';
import { useCampaignControllerListCampaigns } from '@/generated/api/campaign/campaign';
import { DisputeResponseDtoStatus } from '@/generated/api/model/disputeResponseDtoStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { StatusPill } from '@/components/ui/status-pill';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';

function CreateDisputeDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [againstId, setAgainstId] = useState('');
  const [reason, setReason] = useState('');

  const { data: campaigns } = useCampaignControllerListCampaigns(
    { limit: 50 },
    { query: { enabled: open } },
  );

  const { mutate: createDispute, isPending } = useDisputeControllerCreateDispute({
    mutation: {
      onSuccess: () => {
        toast.success('Dispute berhasil diajukan!');
        setCampaignId('');
        setAgainstId('');
        setReason('');
        setOpen(false);
        onCreated();
      },
      onError: () => {
        toast.error('Gagal mengajukan dispute. Coba lagi.');
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Alasan dispute tidak boleh kosong.');
      return;
    }
    if (!againstId.trim()) {
      toast.error('Masukkan ID pengguna yang didisputekan.');
      return;
    }
    createDispute({
      data: {
        reason: reason.trim(),
        againstId: againstId.trim(),
        ...(campaignId ? { campaignId } : {}),
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GradientButton size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ajukan Dispute
        </GradientButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Dispute</DialogTitle>
          <DialogDescription>
            Laporkan masalah terkait campaign atau clip kepada tim kami.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-select">Campaign (opsional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger id="campaign-select">
                <SelectValue placeholder="Pilih campaign terkait" />
              </SelectTrigger>
              <SelectContent>
                {(campaigns?.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="against-id">ID Pengguna yang Didisputekan</Label>
            <Input
              id="against-id"
              placeholder="Masukkan user ID"
              value={againstId}
              onChange={(e) => setAgainstId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ID pengguna (pemilik campaign atau clipper) yang terlibat dalam sengketa.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Alasan Dispute</Label>
            <textarea
              id="reason"
              rows={4}
              placeholder="Jelaskan masalah yang terjadi secara detail..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Mengajukan...' : 'Ajukan Dispute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DisputesPage() {
  const queryClient = useQueryClient();

  const { data: disputeData, isLoading } = useDisputeControllerListDisputes();
  const disputes = disputeData?.data ?? [];

  function handleCreated() {
    queryClient.invalidateQueries({
      queryKey: getDisputeControllerListDisputesQueryKey(),
    });
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Disputes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola sengketa terkait campaign atau clip.
          </p>
        </div>
        <CreateDisputeDialog onCreated={handleCreated} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <GlassCard hover={false} className="p-12 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Tidak ada dispute</p>
          <p className="text-sm text-muted-foreground">
            Kamu belum memiliki dispute yang aktif atau selesai.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {disputes.map((dispute) => {
            const isResolved = dispute.status === DisputeResponseDtoStatus.resolved;
            return (
              <motion.div key={dispute.id} variants={fadeUp}>
                <GlassCard
                  hover={false}
                  className={`p-4 space-y-2${isResolved ? ' gradient-border' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{dispute.reason}</p>
                      {dispute.campaign && (
                        <p className="text-xs text-muted-foreground">
                          Campaign: {dispute.campaign.title}
                        </p>
                      )}
                      {dispute.clip && (
                        <p className="text-xs text-muted-foreground">
                          Clip: {dispute.clip.id}
                        </p>
                      )}
                    </div>
                    <StatusPill status={dispute.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Diajukan:{' '}
                      {new Date(dispute.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {dispute.raisedBy && (
                      <span>Oleh: {dispute.raisedBy.name}</span>
                    )}
                    {dispute.against && (
                      <span>Terhadap: {dispute.against.name}</span>
                    )}
                  </div>
                  {dispute.resolution && (
                    <div className="glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Resolusi: </span>
                      {dispute.resolution}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
