'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface GradientButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'gradient' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'gradient', size = 'md', pulse, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const variantClasses = {
      gradient: 'gradient-fill text-white font-semibold',
      glass: 'glass text-foreground font-medium',
      glow: 'bg-primary text-primary-foreground font-semibold',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring',
          sizeClasses[size],
          variantClasses[variant],
          pulse && 'glow-pulse',
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
GradientButton.displayName = 'GradientButton';
