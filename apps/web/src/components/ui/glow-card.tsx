'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface GlowCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className, glowColor, ...props }: GlowCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{
        y: -2,
        boxShadow: `0 0 24px ${glowColor || 'var(--color-glow)'}`,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-xl border border-border bg-card p-6 transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
