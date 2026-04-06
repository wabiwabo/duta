import { Geist, Geist_Mono, Inter } from 'next/font/google';

export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});
