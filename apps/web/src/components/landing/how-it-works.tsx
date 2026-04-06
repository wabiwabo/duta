'use client';

import { motion } from 'framer-motion';
import { Megaphone, Upload, Wallet } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/motion';

const STEPS = [
  {
    number: '1',
    title: 'Buat / Cari Campaign',
    description:
      'Creator membuat kampanye dengan brief dan budget. Clipper menjelajahi kampanye yang sesuai minat mereka.',
    icon: Megaphone,
  },
  {
    number: '2',
    title: 'Submit Clip & Review',
    description:
      'Clipper membuat dan mengupload konten sesuai brief. Creator mereview dan memberikan feedback langsung.',
    icon: Upload,
  },
  {
    number: '3',
    title: 'Dibayar Otomatis',
    description:
      'Setelah clip disetujui, pembayaran langsung cair dari escrow ke dompet clipper tanpa delay.',
    icon: Wallet,
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="font-[family-name:var(--font-geist)] text-4xl font-bold md:text-5xl">
          <span className="gradient-text">Cara Kerja</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Tiga langkah mudah untuk mulai memviralkan konten
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative flex flex-col gap-8 md:flex-row md:gap-0"
      >
        {/* Connector line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px md:block">
          <div className="mx-auto h-full w-2/3 translate-x-0 bg-gradient-to-r from-transparent via-[oklch(0.65_0.25_280/0.4)] to-transparent" />
        </div>

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="relative flex flex-1 flex-col items-center gap-4 px-4 text-center"
            >
              {/* Connector line (mobile) */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-24 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-[oklch(0.65_0.25_280/0.4)] to-transparent md:hidden" />
              )}

              {/* Numbered circle */}
              <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full gradient-fill shadow-lg">
                <span className="text-xs font-bold text-white/70">Step {step.number}</span>
                <Icon className="h-8 w-8 text-white" />
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-geist)] text-xl font-bold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
