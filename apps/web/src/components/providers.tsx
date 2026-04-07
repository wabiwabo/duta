'use client';

import { LogtoProvider, useLogto } from '@logto/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { logtoConfig } from '@/lib/logto';
import { setAccessTokenGetter } from '@/lib/api-client';
import { I18nProvider } from '@/lib/i18n';

function LogtoTokenBridge() {
  const { getAccessToken } = useLogto();

  useEffect(() => {
    setAccessTokenGetter(async () => {
      const token = await getAccessToken(process.env.NEXT_PUBLIC_API_URL!);
      if (!token) throw new Error('No access token available');
      return token;
    });
  }, [getAccessToken]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <I18nProvider>
      <LogtoProvider config={logtoConfig}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <LogtoTokenBridge />
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </QueryClientProvider>
      </LogtoProvider>
    </I18nProvider>
  );
}
