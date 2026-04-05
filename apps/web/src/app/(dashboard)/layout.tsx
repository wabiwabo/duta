import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell } from '@/components/dashboard-shell';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
