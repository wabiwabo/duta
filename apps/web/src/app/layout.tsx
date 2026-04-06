import type { Metadata } from 'next';
import { geist, geistMono, inter } from '@/lib/fonts';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Duta — Viralkan Kontenmu',
    template: '%s | Duta',
  },
  description:
    'Platform marketplace yang mempertemukan content clipper dengan content owner untuk memviralkan konten melalui clipping.',
  metadataBase: new URL('https://duta.val.id'),
  openGraph: {
    title: 'Duta — Viralkan Kontenmu',
    description: 'Platform marketplace content clipping #1 di Indonesia',
    url: 'https://duta.val.id',
    siteName: 'Duta',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duta — Viralkan Kontenmu',
    description: 'Platform marketplace content clipping #1 di Indonesia',
  },
  robots: {
    index: true,
    follow: true,
  },
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
