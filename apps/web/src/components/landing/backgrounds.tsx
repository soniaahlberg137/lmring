'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';

type GridBackgroundProps = {
  className?: string;
  children?: React.ReactNode;
};

export function GridBackground({ className, children }: GridBackgroundProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full bg-background',
        'bg-[linear-gradient(to_right,rgb(71_85_105/0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgb(71_85_105/0.3)_1px,transparent_1px)]',
        'bg-[size:4rem_4rem]',
        className,
      )}
    >
      {/* Radial gradient mask for fading edges */}
      <div className="pointer-events-none absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,transparent_20%,black_100%)]" />
      {children}
    </div>
  );
}

type DotBackgroundProps = {
  className?: string;
  children?: React.ReactNode;
  dotColor?: string;
};

export function DotBackground({ className, children, dotColor }: DotBackgroundProps) {
  return (
    <div
      className={cn('relative h-full w-full bg-background', className)}
      style={{
        backgroundImage: `radial-gradient(${dotColor || 'rgb(71 85 105)'} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Radial gradient mask for center focus */}
      <div className="pointer-events-none absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,transparent_40%,black_100%)]" />
      {children}
    </div>
  );
}

type BeamProps = {
  className?: string;
  delay?: number;
  duration?: number;
  top?: number;
  width?: number;
};

export function Beam({ className, delay = 0, duration = 8, top = 10, width = 2 }: BeamProps) {
  return (
    <motion.div
      className={cn('absolute left-0 h-px', className)}
      style={{
        top: `${top}%`,
        width: `${width}px`,
        background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
        boxShadow: '0 0 20px 2px hsl(var(--primary) / 0.5)',
      }}
      initial={{ x: '-100%', opacity: 0 }}
      animate={{
        x: ['0%', '100vw'],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: Math.random() * 5 + 5,
        ease: 'linear',
      }}
    />
  );
}

export function BackgroundBeams({ className }: { className?: string }) {
  const beams = [
    { delay: 0, duration: 12, top: 10, width: 200 },
    { delay: 2, duration: 10, top: 25, width: 150 },
    { delay: 4, duration: 14, top: 40, width: 180 },
    { delay: 1, duration: 11, top: 55, width: 120 },
    { delay: 3, duration: 13, top: 70, width: 160 },
    { delay: 5, duration: 9, top: 85, width: 140 },
  ];

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {beams.map((beam, i) => (
        <Beam key={i} {...beam} />
      ))}
    </div>
  );
}

type GradientOrbProps = {
  className?: string;
  color?: string;
  size?: string;
  blur?: string;
  animate?: boolean;
};

export function GradientOrb({
  className,
  color = 'hsl(var(--primary))',
  size = '400px',
  blur = '100px',
  animate = true,
}: GradientOrbProps) {
  const orbStyle = {
    width: size,
    height: size,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    filter: `blur(${blur})`,
  };

  if (!animate) {
    return (
      <div
        className={cn('pointer-events-none absolute rounded-full opacity-30', className)}
        style={orbStyle}
      />
    );
  }

  return (
    <motion.div
      className={cn('pointer-events-none absolute rounded-full opacity-30', className)}
      style={orbStyle}
      animate={{
        x: [0, 50, -30, 0],
        y: [0, -30, 50, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration: 20,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      }}
    />
  );
}
