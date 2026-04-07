'use client';

import { useLogto } from '@logto/react';
import { useEffect, type ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, signIn } = useLogto();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn(window.location.origin + '/callback');
    }
  }, [isAuthenticated, isLoading, signIn]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
