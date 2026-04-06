import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell } from '@/components/dashboard-shell';
import { CommandPalette } from '@/components/command-palette';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
      <CommandPalette />
    </AuthGuard>
  );
}
