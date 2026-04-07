'use client';

import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';

interface Stat {
  label: string;
  value: string;
}

export function FloatingStats({ stats }: { stats: Stat[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-4"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          variants={fadeUp}
          className="glass rounded-full px-5 py-2.5 text-sm font-medium float"
          style={{ animationDelay: `${i * 0.5}s` }}
        >
          <span className="gradient-text font-bold">{stat.value}</span>{' '}
          <span className="text-muted-foreground">{stat.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
