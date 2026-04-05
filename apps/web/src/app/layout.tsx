import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Duta — Viralkan Kontenmu',
  description:
    'Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
