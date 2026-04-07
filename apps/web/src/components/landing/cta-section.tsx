'use client';

import { useLogto } from '@logto/react';
import { motion } from 'framer-motion';
import { Video, Scissors } from 'lucide-react';
import { MeshGradient } from '@/components/mesh-gradient';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { fadeUp, staggerContainer } from '@/lib/motion';

export function CtaSection() {
  const { signIn } = useLogto();

  const handleSignIn = () => {
    signIn(window.location.origin + '/callback');
  };

  return (
    <section className="relative overflow-hidden py-24">
      <MeshGradient />

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-[family-name:var(--font-geist)] text-4xl font-bold md:text-5xl">
            <span className="gradient-text">Siap Memviralkan Kontenmu?</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Bergabung dengan ribuan creator dan clipper yang sudah menggunakan Duta
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Creator Card */}
          <GlassCard hover className="flex flex-col items-center gap-6 text-center">
            <div className="gradient-fill inline-flex h-16 w-16 items-center justify-center rounded-2xl">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-geist)] text-2xl font-bold">
                Daftar sebagai Creator
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Punya konten yang layak viral? Buat campaign dan biarkan clipper profesional membantu kamu.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> Dana terlindungi dengan escrow
              </li>
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> AI matching clipper terbaik
              </li>
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> Dashboard analitik lengkap
              </li>
            </ul>
            <GradientButton
              variant="gradient"
              size="lg"
              pulse
              className="w-full"
              onClick={handleSignIn}
            >
              Mulai sebagai Creator
            </GradientButton>
          </GlassCard>

          {/* Clipper Card */}
          <GlassCard hover className="flex flex-col items-center gap-6 text-center">
            <div className="gradient-fill inline-flex h-16 w-16 items-center justify-center rounded-2xl">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-geist)] text-2xl font-bold">
                Daftar sebagai Clipper
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Jago editing short-form? Gabung campaign, submit clip, dan dapatkan penghasilan.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> Pembayaran otomatis & cepat
              </li>
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> Tier system dengan bonus
              </li>
              <li className="flex items-center gap-2">
                <span className="gradient-text font-bold">✓</span> Komunitas clipper aktif
              </li>
            </ul>
            <GradientButton
              variant="glass"
              size="lg"
              className="w-full"
              onClick={handleSignIn}
            >
              Mulai sebagai Clipper
            </GradientButton>
          </GlassCard>
        </motion.div>
      </div>

      {/* Top fade */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </section>
  );
}
