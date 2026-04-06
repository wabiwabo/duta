'use client';

import { useState } from 'react';
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col glass border-r border-glass-border transition-all duration-300 md:static md:z-auto',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            'flex h-14 flex-shrink-0 items-center border-b border-glass-border transition-all duration-300',
            collapsed ? 'justify-center px-0' : 'justify-between px-4',
          )}
        >
          <span className="gradient-text font-[family-name:var(--font-geist)] text-lg font-bold select-none">
            {collapsed ? 'D' : 'Duta'}
          </span>
          {/* Mobile close */}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Nav items — scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-center border-t border-glass-border py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-glass-border glass px-4 gap-3">
          {/* Left: hamburger (mobile) + search trigger */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden flex-shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Cmd+K search trigger */}
            <button
              className={cn(
                'glass flex items-center gap-2 rounded-lg border border-glass-border px-3 py-1.5',
                'text-sm text-muted-foreground transition-colors hover:text-foreground',
                'hidden sm:flex min-w-0 max-w-xs w-full',
              )}
              onClick={() => {
                // Dispatch keyboard event to trigger CommandPalette
                document.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
                );
              }}
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate flex-1 text-left">Cari atau ketik perintah...</span>
              <kbd className="flex-shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: lang + theme + user */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
