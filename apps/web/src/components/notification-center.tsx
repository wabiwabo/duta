'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Info, Megaphone, Wallet, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  useNotificationControllerList,
  useNotificationControllerMarkAllAsRead,
  useNotificationControllerMarkAsRead,
  getNotificationControllerListQueryKey,
} from '@/generated/api/notification/notification';
import type { NotificationResponseDto } from '@/generated/api/model/notificationResponseDto';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function NotifIcon({ type }: { type: string }) {
  const base = 'h-4 w-4 flex-shrink-0';
  if (type.includes('campaign') || type.includes('Campaign')) {
    return <Megaphone className={cn(base, 'text-blue-400')} />;
  }
  if (type.includes('earning') || type.includes('payment') || type.includes('bonus')) {
    return <Wallet className={cn(base, 'text-green-400')} />;
  }
  if (type.includes('error') || type.includes('rejected') || type.includes('fail')) {
    return <AlertCircle className={cn(base, 'text-red-400')} />;
  }
  return <Info className={cn(base, 'text-primary')} />;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useNotificationControllerList({ limit: 10, page: 1 });
  const notifications: NotificationResponseDto[] = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const { mutate: markAllRead } = useNotificationControllerMarkAllAsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getNotificationControllerListQueryKey({ limit: 10, page: 1 }),
        });
      },
    },
  });

  const { mutate: markRead } = useNotificationControllerMarkAsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getNotificationControllerListQueryKey({ limit: 10, page: 1 }),
        });
      },
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleItemClick(notif: NotificationResponseDto) {
    if (!notif.readAt) {
      markRead({ id: notif.id });
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-lg',
          'text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5',
          open && 'text-foreground bg-white/5',
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full gradient-fill text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-80 rounded-xl glass border border-glass-border shadow-xl',
            'overflow-hidden',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
            <h3 className="text-sm font-semibold">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} belum dibaca
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => {
                  const isUnread = !notif.readAt;
                  return (
                    <li key={notif.id}>
                      <button
                        onClick={() => handleItemClick(notif)}
                        className={cn(
                          'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
                          'hover:bg-white/5',
                          isUnread && 'bg-primary/5',
                        )}
                      >
                        {/* Icon */}
                        <div className="mt-0.5 flex-shrink-0">
                          <NotifIcon type={notif.type} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className={cn('text-sm leading-snug', isUnread ? 'font-medium' : 'text-muted-foreground')}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>

                        {/* Unread dot */}
                        {isUnread && (
                          <span className="mt-1 flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-glass-border px-4 py-2.5">
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
