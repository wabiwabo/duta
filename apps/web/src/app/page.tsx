'use client';

import { useLogto } from '@logto/react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { signIn, isAuthenticated } = useLogto();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          <span className="text-primary">Duta</span> — Viralkan Kontenmu
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Platform marketplace yang mempertemukan content clipper dengan content owner
          untuk memviralkan konten melalui clipping.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <a href="/dashboard">Masuk Dashboard</a>
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => signIn(window.location.origin + '/callback')}
              >
                Mulai Sekarang
              </Button>
              <Button size="lg" variant="outline">
                Pelajari Lebih
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
