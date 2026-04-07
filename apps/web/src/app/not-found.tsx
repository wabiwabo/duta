import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="relative text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-[oklch(0.65_0.25_280/0.15)] blur-[100px]" />
        </div>

        <p className="font-[family-name:var(--font-geist-mono)] text-8xl font-bold gradient-text">
          404
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-geist)] text-2xl font-bold text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg gradient-fill px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg glass px-6 py-3 text-sm font-medium text-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
