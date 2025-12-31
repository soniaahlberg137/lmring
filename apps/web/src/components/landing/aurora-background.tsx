'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type AuroraBackgroundProps = {
  children?: ReactNode;
  className?: string;
  showRadialGradient?: boolean;
};

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-900',
        className,
      )}
    >
      {/* Soft aurora layers - low saturation, gentle gradients */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary soft glow */}
        <motion.div
          className="absolute left-1/2 top-0 h-[800px] w-[1200px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-b from-indigo-500/10 via-slate-500/5 to-transparent blur-[120px]"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary accent - very subtle */}
        <motion.div
          className="absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-t from-slate-600/10 via-indigo-400/5 to-transparent blur-[100px]"
          animate={{
            scale: [1, 1.1, 1],
            x: ['25%', '30%', '25%'],
            y: ['25%', '20%', '25%'],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />

        {/* Tertiary - warm accent */}
        <motion.div
          className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/4 -translate-y-1/2 rounded-full bg-gradient-to-r from-slate-500/5 via-blue-400/5 to-transparent blur-[80px]"
          animate={{
            scale: [1, 1.08, 0.95, 1],
            x: ['-25%', '-20%', '-30%', '-25%'],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Subtle radial gradient for depth */}
      {showRadialGradient && (
        <div className="pointer-events-none absolute inset-0 bg-slate-900 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_80%)]" />
      )}

      {/* Very subtle noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
