'use client';

import { cn } from '@lmring/ui';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

type SparklesProps = {
  className?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
  color?: string;
};

export function Sparkles({
  className,
  count = 50,
  minSize = 1,
  maxSize = 3,
  color = 'hsl(var(--primary))',
}: SparklesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (maxSize - minSize) + minSize,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, [count, minSize, maxSize]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.size / 2}px ${color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

type MeteorProps = {
  className?: string;
};

function Meteor({ className }: MeteorProps) {
  const style = {
    top: `${Math.random() * 50}%`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 3 + 2}s`,
  };

  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute h-0.5 w-0.5 rotate-[215deg] rounded-full bg-foreground/80 shadow-[0_0_0_1px_#ffffff10]',
        'before:absolute before:top-1/2 before:h-px before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-primary/80 before:to-transparent before:content-[""]',
        className,
      )}
      style={style}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{
        x: [0, -500],
        y: [0, 500],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: Math.random() * 10 + 5,
        ease: 'linear',
      }}
    />
  );
}

type MeteorsProps = {
  count?: number;
  className?: string;
};

export function Meteors({ count = 20, className }: MeteorsProps) {
  const [meteors, setMeteors] = useState<number[]>([]);

  useEffect(() => {
    setMeteors(Array.from({ length: count }, (_, i) => i));
  }, [count]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {meteors.map((i) => (
        <Meteor key={i} />
      ))}
    </div>
  );
}

type FloatingParticleProps = {
  className?: string;
  style?: React.CSSProperties;
};

function FloatingParticle({ className, style }: FloatingParticleProps) {
  return (
    <motion.div
      className={cn('absolute h-1 w-1 rounded-full bg-primary/60', className)}
      style={style}
      animate={{
        y: [0, -30, 0],
        opacity: [0.2, 0.8, 0.2],
      }}
      transition={{
        duration: Math.random() * 3 + 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
        delay: Math.random() * 2,
      }}
    />
  );
}

type FloatingParticlesProps = {
  count?: number;
  className?: string;
};

export function FloatingParticles({ count = 30, className }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      })),
    );
  }, [count]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {particles.map((p) => (
        <FloatingParticle
          key={p.id}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
        />
      ))}
    </div>
  );
}
