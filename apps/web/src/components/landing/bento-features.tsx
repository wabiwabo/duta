'use client';

import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  FileVideo,
  Trophy,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { fadeUp, staggerContainer } from '@/lib/motion';

const FEATURES = [
  {
    id: 'escrow',
    title: 'Escrow Terjamin',
    subtitle: 'Pasti Dibayar',
    description:
      'Dana kampanye dikunci di escrow sebelum clipper mulai kerja. Pembayaran otomatis setelah review disetujui.',
    icon: ShieldCheck,
    span: 'col-span-2 row-span-2 md:col-span-2 md:row-span-2',
    iconSize: 'h-10 w-10',
    titleSize: 'text-2xl',
  },
  {
    id: 'ai',
    title: 'AI Matching',
    subtitle: '',
    description: 'Algoritma cerdas mencocokkan clipper terbaik dengan kampanye yang sesuai.',
    icon: Sparkles,
    span: 'col-span-1',
    iconSize: 'h-6 w-6',
    titleSize: 'text-lg',
  },
  {
    id: 'submission',
    title: '3 Mode Submission',
    subtitle: '',
    description: 'Upload link, file video, atau direct post. Fleksibel sesuai kebutuhan.',
    icon: FileVideo,
    span: 'col-span-1',
    iconSize: 'h-6 w-6',
    titleSize: 'text-lg',
  },
  {
    id: 'tier',
    title: 'Tier System',
    subtitle: '',
    description: 'Naik level dari Bronze ke Diamond. Semakin tinggi tier, semakin besar earning.',
    icon: Trophy,
    span: 'col-span-1',
    iconSize: 'h-6 w-6',
    titleSize: 'text-lg',
  },
  {
    id: 'chat',
    title: 'Real-time Chat',
    subtitle: '',
    description: 'Komunikasi langsung antara creator dan clipper dalam satu platform.',
    icon: MessageCircle,
    span: 'col-span-1',
    iconSize: 'h-6 w-6',
    titleSize: 'text-lg',
  },
  {
    id: 'multiplatform',
    title: 'Multi-platform',
    subtitle: '',
    description:
      'Distribusikan konten ke YouTube, TikTok, Instagram, Spotify, dan lebih banyak lagi sekaligus.',
    icon: Globe,
    span: 'col-span-2 md:col-span-4',
    iconSize: 'h-6 w-6',
    titleSize: 'text-lg',
  },
];

export function BentoFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="font-[family-name:var(--font-geist)] text-4xl font-bold md:text-5xl">
          <span className="gradient-text">Semua yang Kamu Butuhkan</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Fitur lengkap untuk creator dan clipper profesional
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <GlassCard
              key={feature.id}
              hover
              className={`gradient-border flex flex-col gap-3 ${feature.span}`}
            >
              <div className="gradient-fill inline-flex h-12 w-12 items-center justify-center rounded-xl">
                <Icon className={`${feature.iconSize} text-white`} />
              </div>
              <div>
                <h3 className={`font-semibold ${feature.titleSize}`}>{feature.title}</h3>
                {feature.subtitle && (
                  <p className="gradient-text text-sm font-semibold">{feature.subtitle}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          );
        })}
      </motion.div>
    </section>
  );
}
