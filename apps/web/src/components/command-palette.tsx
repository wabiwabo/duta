'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Megaphone, Scissors, Wallet, MessageSquare, User,
  Plus, Search, BarChart3, Users, Shield,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navigasi' },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone, group: 'Navigasi' },
  { label: 'Clips', href: '/clips', icon: Scissors, group: 'Navigasi' },
  { label: 'Earnings', href: '/earnings', icon: Wallet, group: 'Navigasi' },
  { label: 'Messages', href: '/messages', icon: MessageSquare, group: 'Navigasi' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Navigasi' },
  { label: 'Team', href: '/team', icon: Users, group: 'Navigasi' },
  { label: 'Profile', href: '/profile', icon: User, group: 'Navigasi' },
  { label: 'Create Campaign', href: '/campaigns/new', icon: Plus, group: 'Actions' },
  { label: 'Admin Panel', href: '/admin', icon: Shield, group: 'Admin' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runAction = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-lg"
          >
            <Command className="glass rounded-xl border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Command.Input
                  placeholder="Cari atau ketik perintah..."
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  Tidak ditemukan.
                </Command.Empty>
                {['Navigasi', 'Actions', 'Admin'].map((group) => {
                  const items = navItems.filter((i) => i.group === group);
                  if (items.length === 0) return null;
                  return (
                    <Command.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Command.Item
                            key={item.href}
                            value={item.label}
                            onSelect={() => runAction(item.href)}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
