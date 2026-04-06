import type { Metadata } from 'next';
import { geist, geistMono, inter } from '@/lib/fonts';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duta — Viralkan Kontenmu',
  description:
    'Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} ${inter.variable} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
