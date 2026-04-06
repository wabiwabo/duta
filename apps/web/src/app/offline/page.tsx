'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-[family-name:var(--font-geist-mono)] text-6xl font-bold gradient-text">Offline</p>
      <h1 className="mt-4 text-xl font-bold">Kamu sedang offline</h1>
      <p className="mt-2 text-muted-foreground">Periksa koneksi internet dan coba lagi.</p>
      <button onClick={() => window.location.reload()} className="mt-6 rounded-lg gradient-fill px-6 py-3 text-white font-semibold">
        Coba Lagi
      </button>
    </div>
  );
}
