'use client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <Globe className="h-4 w-4" />
      <span className="sr-only">{locale === 'id' ? 'English' : 'Bahasa'}</span>
    </Button>
  );
}
