'use client';

import { useState } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminControllerListUsers,
  useAdminControllerUpdateUser,
} from '@/generated/api/admin/admin';
import { AdminControllerListUsersRole } from '@/generated/api/model/adminControllerListUsersRole';
import { AdminUserActionDtoAction } from '@/generated/api/model/adminUserActionDtoAction';
import type { AdminUserResponseDto } from '@/generated/api/model/adminUserResponseDto';

const PAGE_SIZE = 20;

const KYC_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  none: { label: 'None', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'outline' },
  verified: { label: 'Verified', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  clipper: 'Clipper',
  admin: 'Admin',
};

function UserRow({ user, onAction }: { user: AdminUserResponseDto; onAction: (userId: string, action: string) => void }) {
  const kyc = KYC_STATUS_CONFIG[user.kycStatus] ?? { label: user.kycStatus, variant: 'secondary' as const };

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-3">
        <div>
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="capitalize text-xs">
          {ROLE_LABEL[user.role] ?? user.role}
        </Badge>
      </td>
      <td className="p-3">
        <Badge variant={kyc.variant} className="text-xs">
          {kyc.label}
        </Badge>
      </td>
      <td className="p-3 text-sm text-right tabular-nums">{user.clipperScore}</td>
      <td className="p-3 text-xs text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onAction(user.id, AdminUserActionDtoAction.verify_kyc)}
          >
            Verify KYC
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onAction(user.id, AdminUserActionDtoAction.activate)}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            onClick={() => onAction(user.id, AdminUserActionDtoAction.suspend)}
          >
            Suspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => onAction(user.id, AdminUserActionDtoAction.ban)}
          >
            Ban
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>('all');

  const roleParam =
    role !== 'all'
      ? (role as AdminControllerListUsersRole)
      : undefined;

  const { data, isLoading, refetch } = useAdminControllerListUsers({
    page,
    limit: PAGE_SIZE,
    role: roleParam,
  });

  const { mutate: updateUser } = useAdminControllerUpdateUser();

  const users: AdminUserResponseDto[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleAction(userId: string, action: string) {
    updateUser(
      {
        id: userId,
        data: { action: action as AdminUserActionDtoAction },
      },
      { onSuccess: () => refetch() },
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Users</h2>
          <p className="text-muted-foreground text-sm">{total} user terdaftar</p>
        </div>

        {/* Filter */}
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value={AdminControllerListUsersRole.owner}>Owner</SelectItem>
            <SelectItem value={AdminControllerListUsersRole.clipper}>Clipper</SelectItem>
            <SelectItem value={AdminControllerListUsersRole.admin}>Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Tidak ada user ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">KYC</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Score</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Bergabung</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow key={user.id} user={user} onAction={handleAction} />
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
