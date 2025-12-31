'use client';

import { cn } from '@lmring/ui';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback } from 'react';

type SpotlightProps = {
  children: ReactNode;
  className?: string;
  spotlightClassName?: string;
};

export function Spotlight({ children, className, spotlightClassName }: SpotlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const { left, top } = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Mouse tracking for visual spotlight effect only
    <div className={cn('group relative', className)} onMouseMove={handleMouseMove}>
      <motion.div
        className={cn(
          'pointer-events-none absolute -inset-px z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          spotlightClassName,
        )}
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary-rgb, 59 130 246) / 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const { left, top } = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Mouse tracking for visual spotlight effect only
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-px',
        className,
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight border effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary-rgb, 59 130 246) / 0.4),
              transparent 40%
            )
          `,
        }}
      />
      {/* Inner spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              250px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary-rgb, 59 130 246) / 0.1),
              transparent 40%
            )
          `,
        }}
      />
      <div className="relative z-20 h-full rounded-[15px] bg-card">{children}</div>
    </div>
  );
}
