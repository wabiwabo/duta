'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true, ...props }: GlassCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={hover ? { y: -2, transition: { type: 'spring', stiffness: 400, damping: 30 } } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      className={cn(
        'glass rounded-xl p-6',
        hover && 'glow-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
