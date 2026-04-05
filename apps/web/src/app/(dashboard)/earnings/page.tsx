'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, Clock, ArrowDownToLine } from 'lucide-react';
import {
  useEarningsControllerGetEarnings,
  useEarningsControllerListTransactions,
  useEarningsControllerRequestWithdrawal,
  getEarningsControllerGetEarningsQueryKey,
  getEarningsControllerListTransactionsQueryKey,
} from '@/generated/api/earnings/earnings';
import { TransactionResponseDtoType } from '@/generated/api/model/transactionResponseDtoType';
import { TransactionResponseDtoStatus } from '@/generated/api/model/transactionResponseDtoStatus';
import { EarningsControllerListTransactionsType } from '@/generated/api/model/earningsControllerListTransactionsType';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const BANK_OPTIONS = [
  { code: 'BCA', label: 'BCA' },
  { code: 'BNI', label: 'BNI' },
  { code: 'BRI', label: 'BRI' },
  { code: 'MANDIRI', label: 'Mandiri' },
  { code: 'OVO', label: 'OVO' },
  { code: 'GOPAY', label: 'GoPay' },
  { code: 'DANA', label: 'Dana' },
  { code: 'SHOPEEPAY', label: 'ShopeePay' },
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  [TransactionResponseDtoType.deposit]: {
    label: 'Deposit',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [TransactionResponseDtoType.payout]: {
    label: 'Payout',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [TransactionResponseDtoType.refund]: {
    label: 'Refund',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  [TransactionResponseDtoType.fee]: {
    label: 'Fee',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  [TransactionResponseDtoStatus.pending]: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [TransactionResponseDtoStatus.processing]: {
    label: 'Diproses',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [TransactionResponseDtoStatus.completed]: {
    label: 'Selesai',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  [TransactionResponseDtoStatus.failed]: {
    label: 'Gagal',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

const MINIMUM_WITHDRAWAL = 50000;
const PAGE_SIZE = 10;

export default function EarningsPage() {
  const queryClient = useQueryClient();

  // Withdrawal form state
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [amount, setAmount] = useState('');

  // Transaction filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: summaryLoading } = useEarningsControllerGetEarnings();

  const txParams = {
    page,
    limit: PAGE_SIZE,
    ...(typeFilter !== 'all' && { type: typeFilter as EarningsControllerListTransactionsType }),
  };

  const { data: txData, isLoading: txLoading } = useEarningsControllerListTransactions(txParams);

  const { mutate: requestWithdrawal, isPending: isWithdrawing } =
    useEarningsControllerRequestWithdrawal({
      mutation: {
        onSuccess: () => {
          toast.success('Penarikan dana berhasil diajukan!');
          setBankCode('');
          setAccountNumber('');
          setAccountHolderName('');
          setAmount('');
          queryClient.invalidateQueries({ queryKey: getEarningsControllerGetEarningsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getEarningsControllerListTransactionsQueryKey(),
          });
        },
        onError: () => {
          toast.error('Gagal mengajukan penarikan. Coba lagi.');
        },
      },
    });

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!bankCode) {
      toast.error('Pilih bank atau e-wallet terlebih dahulu.');
      return;
    }
    if (!accountNumber.trim()) {
      toast.error('Masukkan nomor rekening.');
      return;
    }
    if (!accountHolderName.trim()) {
      toast.error('Masukkan nama pemilik rekening.');
      return;
    }
    if (numAmount < MINIMUM_WITHDRAWAL) {
      toast.error(`Minimal penarikan adalah ${formatRupiah(MINIMUM_WITHDRAWAL)}.`);
      return;
    }
    if (summary && numAmount > summary.available) {
      toast.error('Jumlah melebihi saldo tersedia.');
      return;
    }
    requestWithdrawal({
      data: {
        bankCode,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        amount: numAmount,
      },
    });
  }

  const available = summary?.available ?? 0;
  const canWithdraw = available >= MINIMUM_WITHDRAWAL;
  const transactions = txData?.data ?? [];
  const totalTx = txData?.total ?? 0;
  const totalPages = Math.ceil(totalTx / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola pendapatan dan penarikan dana kamu.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Diperoleh */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            Total Diperoleh
          </div>
          {summaryLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-xl font-bold text-green-600">
              {formatRupiah(summary?.earned ?? 0)}
            </p>
          )}
        </div>

        {/* Menunggu Verifikasi */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-yellow-600" />
            Menunggu Verifikasi
          </div>
          {summaryLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-xl font-bold text-yellow-600">
              {formatRupiah(summary?.pending ?? 0)}
            </p>
          )}
        </div>

        {/* Saldo Tersedia */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            Saldo Tersedia
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold text-primary">
              {formatRupiah(summary?.available ?? 0)}
            </p>
          )}
        </div>

        {/* Total Ditarik */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />
            Total Ditarik
          </div>
          {summaryLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-xl font-bold text-muted-foreground">
              {formatRupiah(summary?.withdrawn ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* Withdrawal Section */}
      {!summaryLoading && canWithdraw && (
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Tarik Dana</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Saldo tersedia: <span className="font-medium text-foreground">{formatRupiah(available)}</span>
            </p>
          </div>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bankCode">Bank / E-Wallet</Label>
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger id="bankCode">
                    <SelectValue placeholder="Pilih bank atau e-wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input
                  id="accountNumber"
                  placeholder="Masukkan nomor rekening"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountHolderName">Nama Pemilik Rekening</Label>
                <Input
                  id="accountHolderName"
                  placeholder="Sesuai nama di rekening"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">
                  Jumlah (min. {formatRupiah(MINIMUM_WITHDRAWAL)})
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min={MINIMUM_WITHDRAWAL}
                  max={available}
                  placeholder="Masukkan jumlah"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={isWithdrawing}>
              {isWithdrawing ? 'Memproses...' : 'Tarik Dana'}
            </Button>
          </form>
        </section>
      )}

      {!summaryLoading && !canWithdraw && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Saldo tersedia harus minimal {formatRupiah(MINIMUM_WITHDRAWAL)} untuk melakukan penarikan.
          </p>
        </div>
      )}

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold">Riwayat Transaksi</h2>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40" size="sm">
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value={TransactionResponseDtoType.deposit}>Deposit</SelectItem>
              <SelectItem value={TransactionResponseDtoType.payout}>Payout</SelectItem>
              <SelectItem value={TransactionResponseDtoType.refund}>Refund</SelectItem>
              <SelectItem value={TransactionResponseDtoType.fee}>Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {txLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Campaign</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => {
                    const typeCfg = TYPE_BADGE[tx.type] ?? { label: tx.type, className: 'bg-muted text-muted-foreground' };
                    const statusCfg = STATUS_BADGE[tx.status] ?? { label: tx.status, className: 'bg-muted text-muted-foreground' };
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={['text-xs font-semibold px-2 py-0.5 rounded-full', typeCfg.className].join(' ')}>
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={['text-xs font-semibold px-2 py-0.5 rounded-full', statusCfg.className].join(' ')}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[160px] truncate">
                          {(tx.campaign as Record<string, unknown> | undefined)?.['title'] as string ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell font-mono truncate max-w-[120px]">
                          {(tx.paymentReference as string | null | undefined) ?? tx.id.slice(0, 8) + '…'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Halaman {page} dari {totalPages} ({totalTx} transaksi)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
