import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duta — Viralkan Kontenmu',
  description:
    'Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
