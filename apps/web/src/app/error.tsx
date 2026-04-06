'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="relative text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-[oklch(0.60_0.22_25/0.15)] blur-[100px]" />
        </div>

        <p className="font-[family-name:var(--font-geist-mono)] text-8xl font-bold gradient-text">
          500
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-geist)] text-2xl font-bold text-foreground">
          Terjadi Kesalahan
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Maaf, terjadi kesalahan pada server. Silakan coba lagi.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg gradient-fill px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-lg glass px-6 py-3 text-sm font-medium text-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Kembali ke Beranda
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground/50">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
