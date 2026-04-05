'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

type Locale = 'id' | 'en';
type Translations = Record<string, Record<string, string>>;

const translations: Translations = {
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Campaign',
    'nav.clips': 'Klip',
    'nav.earnings': 'Pendapatan',
    'nav.messages': 'Pesan',
    'nav.profile': 'Profil',
    'nav.disputes': 'Dispute',
    'nav.admin': 'Admin',
    'nav.analytics': 'Analitik',
    'nav.team': 'Tim',
    'dashboard.welcome': 'Selamat datang di Duta Platform',
    'dashboard.active_campaigns': 'Campaign Aktif',
    'dashboard.clips_submitted': 'Klip Terkirim',
    'dashboard.earnings': 'Pendapatan',
    'dashboard.tier': 'Tier',
    'campaign.create': 'Buat Campaign',
    'campaign.browse': 'Jelajahi Campaign',
    'campaign.type.bounty': 'Bounty',
    'campaign.type.gig': 'Gig',
    'campaign.type.podcast': 'Podcast',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.submit': 'Kirim',
    'common.loading': 'Memuat...',
    'common.no_data': 'Belum ada data',
    'common.search': 'Cari...',
    'auth.sign_in': 'Masuk',
    'auth.sign_out': 'Keluar',
    'auth.sign_up': 'Daftar',
    'earnings.total': 'Total Diperoleh',
    'earnings.pending': 'Menunggu Verifikasi',
    'earnings.available': 'Saldo Tersedia',
    'earnings.withdrawn': 'Total Ditarik',
    'earnings.withdraw': 'Tarik Dana',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Campaigns',
    'nav.clips': 'Clips',
    'nav.earnings': 'Earnings',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.disputes': 'Disputes',
    'nav.admin': 'Admin',
    'nav.analytics': 'Analytics',
    'nav.team': 'Team',
    'dashboard.welcome': 'Welcome to Duta Platform',
    'dashboard.active_campaigns': 'Active Campaigns',
    'dashboard.clips_submitted': 'Clips Submitted',
    'dashboard.earnings': 'Earnings',
    'dashboard.tier': 'Tier',
    'campaign.create': 'Create Campaign',
    'campaign.browse': 'Browse Campaigns',
    'campaign.type.bounty': 'Bounty',
    'campaign.type.gig': 'Gig',
    'campaign.type.podcast': 'Podcast',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.no_data': 'No data yet',
    'common.search': 'Search...',
    'auth.sign_in': 'Sign In',
    'auth.sign_out': 'Sign Out',
    'auth.sign_up': 'Sign Up',
    'earnings.total': 'Total Earned',
    'earnings.pending': 'Pending Verification',
    'earnings.available': 'Available Balance',
    'earnings.withdrawn': 'Total Withdrawn',
    'earnings.withdraw': 'Withdraw',
  },
};

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: 'id', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('id');
  const t = (key: string) => translations[locale]?.[key] ?? key;
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
