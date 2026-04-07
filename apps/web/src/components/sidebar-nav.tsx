'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Megaphone,
  Scissors,
  Wallet,
  MessageSquare,
  ShieldAlert,
  Shield,
  Users,
  BarChart3,
  Building2,
  Gift,
  CalendarClock,
} from 'lucide-react';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/clips', label: 'Clips', icon: Scissors },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/team', label: 'Team', icon: Building2 },
  { href: '/disputes', label: 'Disputes', icon: ShieldAlert },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/referral', label: 'Referral', icon: Gift },
  { href: '/scheduled', label: 'Jadwal Post', icon: CalendarClock },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Overview', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns (Admin)', icon: Megaphone },
];

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    pathname === href ||
    (href !== '/dashboard' &&
      pathname.startsWith(href) &&
      href !== '/campaigns' &&
      href !== '/clips');

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
        'transition-all duration-200 hover:translate-x-1',
        collapsed ? 'justify-center px-0' : 'px-3',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
      )}
    >
      {/* Active gradient left border indicator */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full gradient-fill"
          aria-hidden="true"
        />
      )}

      <Icon
        className={cn(
          'flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
          isActive ? 'h-4 w-4' : 'h-4 w-4',
        )}
      />

      {/* Label — fade out when collapsed */}
      <span
        className={cn(
          'truncate transition-all duration-200',
          collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100',
        )}
      >
        {label}
      </span>
    </Link>
  );
}

interface SidebarNavProps {
  collapsed?: boolean;
}

export function SidebarNav({ collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: profile } = useUserControllerGetProfile();
  const isAdmin = profile?.role === UserProfileDtoRole.admin;

  return (
    <nav className={cn('flex flex-col gap-1 py-4', collapsed ? 'px-1' : 'px-2')}>
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} pathname={pathname} collapsed={collapsed} />
      ))}

      {isAdmin && (
        <>
          <div className={cn('my-2 border-t border-glass-border', collapsed ? 'mx-1' : 'mx-3')} />
          {!collapsed && (
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          )}
          {adminNavItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} collapsed={collapsed} />
          ))}
        </>
      )}
    </nav>
  );
}
