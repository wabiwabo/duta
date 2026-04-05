'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserControllerGetProfile } from '@/generated/api/user/user';
import { UserProfileDtoRole } from '@/generated/api/model/userProfileDtoRole';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: profile, isLoading } = useUserControllerGetProfile();

  useEffect(() => {
    if (!isLoading && profile && profile.role !== UserProfileDtoRole.admin) {
      router.replace('/dashboard');
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile || profile.role !== UserProfileDtoRole.admin) {
    return null;
  }

  return <>{children}</>;
}
