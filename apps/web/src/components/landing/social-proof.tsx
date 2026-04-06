'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

const PLATFORMS = [
  { name: 'YouTube', color: 'text-red-400' },
  { name: 'TikTok', color: 'text-pink-400' },
  { name: 'Instagram', color: 'text-purple-400' },
  { name: 'Spotify', color: 'text-green-400' },
  { name: 'Podcast', color: 'text-orange-400' },
  { name: 'Twitter / X', color: 'text-sky-400' },
  { name: 'Facebook', color: 'text-blue-400' },
];

const PLATFORM_LIST = [...PLATFORMS, ...PLATFORMS];

export function SocialProof() {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-10 text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Dipercaya oleh kreator dari
        </motion.p>
      </div>

      {/* Marquee wrapper with fade edges */}
      <div className="relative">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

        <div
          className="flex gap-12 overflow-hidden"
          aria-hidden="true"
        >
          <ul
            className="flex shrink-0 items-center gap-12"
            style={{ animation: 'marquee 30s linear infinite' }}
          >
            {PLATFORM_LIST.map((platform, i) => (
              <li
                key={`${platform.name}-${i}`}
                className={`flex shrink-0 items-center gap-2 font-[family-name:var(--font-geist)] text-xl font-bold ${platform.color}`}
              >
                <span className="text-2xl">•</span>
                <span>{platform.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
