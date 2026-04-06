import Link from 'next/link';

const LINKS = {
  Platform: [
    { label: 'Tentang', href: '/tentang' },
    { label: 'Karir', href: '/karir' },
    { label: 'Blog', href: '/blog' },
  ],
  Fitur: [
    { label: 'Escrow', href: '/fitur/escrow' },
    { label: 'AI Matching', href: '/fitur/ai-matching' },
    { label: 'Chat', href: '/fitur/chat' },
  ],
  Legal: [
    { label: 'Privasi', href: '/privasi' },
    { label: 'Syarat', href: '/syarat' },
    { label: 'Kebijakan', href: '/kebijakan' },
  ],
  Kontak: [
    { label: 'Email', href: 'mailto:hello@duta.id' },
    { label: 'Twitter', href: 'https://twitter.com/duta_id' },
    { label: 'Instagram', href: 'https://instagram.com/duta.id' },
  ],
};

export function Footer() {
  return (
    <footer className="glass border-t border-glass-border">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <div className="font-[family-name:var(--font-geist)] text-lg font-bold">
            <span className="gradient-text">Duta</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Duta. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Made with ♥ in Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
