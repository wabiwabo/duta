'use client';

import { useLogto } from '@logto/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MeshGradient } from '@/components/mesh-gradient';
import { FloatingStats } from '@/components/floating-stats';
import { GradientButton } from '@/components/ui/gradient-button';
import { fadeUp, staggerContainer } from '@/lib/motion';

const STATS = [
  { value: '15K+', label: 'Clipper' },
  { value: '5K+', label: 'Creator' },
  { value: 'Rp 2M+', label: 'GMV' },
];

export function Hero() {
  const { signIn, isAuthenticated } = useLogto();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <MeshGradient />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-8"
        >
          <motion.div variants={fadeUp}>
            <span className="glass rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground">
              Platform Clipping #1 di Indonesia
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-[family-name:var(--font-geist)] text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
            style={{ fontWeight: 800 }}
          >
            <span className="gradient-text">Viralkan Kontenmu</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-xl font-[family-name:var(--font-inter)] text-lg text-muted-foreground md:text-xl"
          >
            Platform marketplace yang menghubungkan content clipper dengan content owner
            untuk memviralkan konten.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <GradientButton variant="gradient" size="lg" pulse>
                  Masuk Dashboard
                </GradientButton>
              </Link>
            ) : (
              <>
                <GradientButton
                  variant="gradient"
                  size="lg"
                  pulse
                  onClick={() => signIn(window.location.origin + '/callback')}
                >
                  Mulai Sekarang
                </GradientButton>
                <GradientButton variant="glass" size="lg">
                  Lihat Demo
                </GradientButton>
              </>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-4 w-full">
            <FloatingStats stats={STATS} />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
