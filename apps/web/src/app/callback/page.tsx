'use client';

import { useHandleSignInCallback } from '@logto/react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  const { isLoading } = useHandleSignInCallback(() => {
    router.push('/dashboard');
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return null;
}
