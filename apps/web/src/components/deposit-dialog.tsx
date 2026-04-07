'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Info } from 'lucide-react';
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
  usePaymentControllerDepositToCampaign,
  usePaymentControllerGetEscrow,
} from '@/generated/api/payment/payment';
import { formatRupiah } from '@/lib/format';

const MINIMUM_DEPOSIT = 50000;

interface DepositDialogProps {
  campaignId: string;
}

export function DepositDialog({ campaignId }: DepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: escrow, isLoading: escrowLoading } = usePaymentControllerGetEscrow(campaignId, {
    query: { enabled: open },
  });

  const { mutate: deposit, isPending: isDepositing } = usePaymentControllerDepositToCampaign({
    mutation: {
      onSuccess: (data) => {
        toast.success('Invoice berhasil dibuat!');
        if (data.invoiceUrl) {
          window.open(data.invoiceUrl, '_blank', 'noopener,noreferrer');
        }
        setAmount('');
        setOpen(false);
      },
      onError: () => {
        toast.error('Gagal membuat invoice deposit. Coba lagi.');
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (numAmount < MINIMUM_DEPOSIT) {
      toast.error(`Minimal deposit adalah ${formatRupiah(MINIMUM_DEPOSIT)}.`);
      return;
    }
    deposit({ id: campaignId, data: { amount: numAmount } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit ke Campaign</DialogTitle>
          <DialogDescription>
            Tambah saldo escrow untuk membayar clipper.
          </DialogDescription>
        </DialogHeader>

        {/* Escrow balance */}
        {escrowLoading ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : escrow && escrow.balance !== undefined ? (
          <div className="rounded-lg bg-muted/50 border px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">Saldo Escrow Saat Ini</p>
            <p className="text-lg font-bold text-primary">{formatRupiah(escrow.balance)}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Masuk: {formatRupiah(escrow.totalDeposited ?? 0)}</span>
              <span>Keluar: {formatRupiah(escrow.totalReleased ?? 0)}</span>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">
              Jumlah Deposit (min. {formatRupiah(MINIMUM_DEPOSIT)})
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              min={MINIMUM_DEPOSIT}
              step={1000}
              placeholder="Masukkan jumlah deposit"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Setelah pembayaran, saldo akan otomatis masuk ke escrow campaign.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDepositing}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isDepositing}>
              {isDepositing ? 'Membuat invoice...' : 'Buat Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
