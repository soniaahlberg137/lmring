'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type TextGradientProps = {
  children: ReactNode;
  className?: string;
  animate?: boolean;
};

export function TextGradient({ children, className, animate = false }: TextGradientProps) {
  if (animate) {
    return (
      <motion.span
        className={cn(
          'bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] bg-clip-text text-transparent',
          className,
        )}
        animate={{
          backgroundPosition: ['0% center', '200% center'],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span
      className={cn(
        'bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent',
        className,
      )}
    >
      {children}
    </span>
  );
}

type TextShimmerProps = {
  children: ReactNode;
  className?: string;
};

export function TextShimmer({ children, className }: TextShimmerProps) {
  return (
    <motion.span
      className={cn(
        'relative inline-block bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-[length:200%_100%] bg-clip-text text-transparent',
        className,
      )}
      animate={{
        backgroundPosition: ['100% 0', '-100% 0'],
      }}
      transition={{
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}

type HighlightTextProps = {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
};

export function HighlightText({ children, className, highlightClassName }: HighlightTextProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      <motion.span
        className={cn(
          'absolute -inset-1 -z-10 block rounded-lg bg-primary/20 blur-md',
          highlightClassName,
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      {children}
    </span>
  );
}

type TypewriterProps = {
  text: string;
  className?: string;
  speed?: number;
};

export function Typewriter({ text, className, speed = 50 }: TypewriterProps) {
  return (
    <motion.span className={cn('', className)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: index * (speed / 1000),
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

type RevealTextProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function RevealText({ children, className, delay = 0 }: RevealTextProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.25, 0.4, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
