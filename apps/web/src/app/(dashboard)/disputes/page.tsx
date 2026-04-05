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
import { Badge } from '@/components/ui/badge';
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

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  [DisputeResponseDtoStatus.open]: {
    label: 'Terbuka',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [DisputeResponseDtoStatus.under_review]: {
    label: 'Ditinjau',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [DisputeResponseDtoStatus.resolved]: {
    label: 'Diselesaikan',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
};

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
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ajukan Dispute
        </Button>
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
        <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Tidak ada dispute</p>
          <p className="text-sm text-muted-foreground">
            Kamu belum memiliki dispute yang aktif atau selesai.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const statusCfg = STATUS_BADGE[dispute.status] ?? {
              label: dispute.status,
              className: 'bg-muted text-muted-foreground',
            };
            return (
              <div key={dispute.id} className="rounded-lg border bg-card p-4 space-y-2">
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
                  <span
                    className={[
                      'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                      statusCfg.className,
                    ].join(' ')}
                  >
                    {statusCfg.label}
                  </span>
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
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Resolusi: </span>
                    {dispute.resolution as unknown as string}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
