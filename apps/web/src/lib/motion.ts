import { type Transition, type Variants } from 'framer-motion';

export const spring: Transition = { type: 'spring', stiffness: 400, damping: 30 };
export const springBouncy: Transition = { type: 'spring', stiffness: 300, damping: 20 };
export const springGentle: Transition = { type: 'spring', stiffness: 200, damping: 25 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const hoverLift = {
  whileHover: { y: -2, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  whileTap: { scale: 0.98 },
};
