'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type AnimatedButtonProps = ComponentProps<typeof Link> & {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
  showArrow?: boolean;
};

export function AnimatedButton({
  variant = 'primary',
  children,
  className,
  showArrow = true,
  ...props
}: AnimatedButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Link
        className={cn(
          'group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-8 text-sm font-medium transition-all duration-300',
          isPrimary
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
            : 'border border-white/20 bg-white text-slate-900 hover:bg-slate-100',
          className,
        )}
        {...props}
      >
        {/* Primary button effects */}
        {isPrimary && (
          <>
            {/* Gradient overlay */}
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />

            {/* Shimmer effect */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

            {/* Top highlight */}
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </>
        )}

        {/* Secondary button effects */}
        {!isPrimary && (
          <>
            {/* Subtle shadow on hover */}
            <span className="absolute inset-0 rounded-full opacity-0 shadow-lg shadow-slate-900/10 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {isPrimary && showArrow && (
            <motion.span
              className="inline-flex"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          )}
        </span>
      </Link>
    </motion.div>
  );
}

type GlowButtonProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  glowColor?: string;
};

export function GlowButton({
  children,
  className,
  glowColor = 'primary',
  ...props
}: GlowButtonProps) {
  return (
    <motion.div
      className="group relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      <span
        className={cn(
          'absolute -inset-1 rounded-full opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-70',
          `bg-${glowColor}`,
        )}
      />

      <Link
        className={cn(
          'relative inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border/50 bg-background px-8 text-sm font-medium text-foreground transition-colors duration-300 hover:border-border',
          className,
        )}
        {...props}
      >
        {children}
      </Link>
    </motion.div>
  );
}

// Rainbow Button with animated gradient border
type RainbowButtonProps = ComponentProps<typeof Link> & {
  children: ReactNode;
};

export function RainbowButton({ children, className, ...props }: RainbowButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Link
        className={cn(
          'group relative inline-flex h-12 animate-rainbow cursor-pointer items-center justify-center rounded-full border-0 bg-[length:200%] px-8 py-2 text-sm font-medium transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]',
          // Rainbow gradient colors - dark inner background
          'bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(180,100%,63%),hsl(270,100%,63%),hsl(360,100%,63%))]',
          // Glow effect
          'before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(180,100%,63%),hsl(270,100%,63%),hsl(360,100%,63%))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]',
          className,
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2 text-white">{children}</span>
      </Link>
    </motion.div>
  );
}
