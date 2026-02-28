'use client';

import { useReducedMotion, type Variants } from 'framer-motion';
import { useMemo } from 'react';

export interface SpringPreset {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

export const springPresets: Record<'gentle' | 'snappy' | 'smooth' | 'bouncy', SpringPreset> = {
  gentle: { type: 'spring', stiffness: 120, damping: 18, mass: 1 },
  snappy: { type: 'spring', stiffness: 300, damping: 24, mass: 0.85 },
  smooth: { type: 'spring', stiffness: 180, damping: 22, mass: 1 },
  bouncy: { type: 'spring', stiffness: 260, damping: 14, mass: 0.9 },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springPresets.smooth,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

export function useMotionConfig<T extends object>(motionConfig: T): T | Record<string, never> {
  const prefersReducedMotion = usePrefersReducedMotion();

  return useMemo(() => {
    if (prefersReducedMotion) {
      return {};
    }
    return motionConfig;
  }, [motionConfig, prefersReducedMotion]);
}
