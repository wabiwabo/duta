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
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Overview', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns (Admin)', icon: Megaphone },
];

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.ElementType; pathname: string }) {
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href) && href !== '/campaigns' && href !== '/clips');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { data: profile } = useUserControllerGetProfile();
  const isAdmin = profile?.role === UserProfileDtoRole.admin;

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} pathname={pathname} />
      ))}

      {isAdmin && (
        <>
          <div className="mx-3 my-2 border-t" />
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </p>
          {adminNavItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </>
      )}
    </nav>
  );
}
