import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import type { ReactNode } from 'react';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-bold text-primary">Duta</span>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
