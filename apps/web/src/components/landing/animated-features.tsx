'use client';

import { cn } from '@lmring/ui';
import { motion, useInView, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Brain, Globe, Zap } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useRef } from 'react';

const iconMap = {
  zap: Zap,
  brain: Brain,
  globe: Globe,
} as const;

type IconName = keyof typeof iconMap;

type Feature = {
  icon: IconName;
  title: ReactNode;
  description: ReactNode;
};

type AnimatedFeaturesProps = {
  title: ReactNode;
  features: Feature[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

const colorThemes = [
  {
    gradient: 'from-violet-500 to-purple-500',
    bg: 'from-violet-500/10 to-purple-500/10',
    glow: 'violet-500',
    text: 'text-violet-500',
  },
  {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-500/10 to-orange-500/10',
    glow: 'amber-500',
    text: 'text-amber-500',
  },
  {
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'from-cyan-500/10 to-blue-500/10',
    glow: 'cyan-500',
    text: 'text-cyan-500',
  },
];

function SpotlightFeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = iconMap[feature.icon];
  const theme = colorThemes[index % colorThemes.length];
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
    <motion.div variants={cardVariants} className="group relative" onMouseMove={handleMouseMove}>
      {/* Outer glow on hover */}
      <div
        className={cn(
          'absolute -inset-px rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40',
          `bg-gradient-to-r ${theme?.gradient}`,
        )}
      />

      {/* Card container */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-colors duration-300 group-hover:border-border">
        {/* Spotlight effect */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                350px circle at ${mouseX}px ${mouseY}px,
                hsl(var(--primary) / 0.15),
                transparent 40%
              )
            `,
          }}
        />

        {/* Border glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                400px circle at ${mouseX}px ${mouseY}px,
                hsl(var(--primary) / 0.2),
                transparent 40%
              )
            `,
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Icon */}
          <motion.div
            className={cn(
              'mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br backdrop-blur-sm',
              theme?.bg,
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Icon className={cn('h-7 w-7', theme?.text)} strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <h3 className="mb-3 text-xl font-semibold tracking-tight text-card-foreground">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground/80 leading-relaxed">{feature.description}</p>
        </div>

        {/* Corner decoration */}
        <div
          className={cn(
            'absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30',
            `bg-gradient-to-br ${theme?.gradient}`,
          )}
        />
      </div>
    </motion.div>
  );
}

export function AnimatedFeatures({ title, features }: AnimatedFeaturesProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section header */}
          <motion.div variants={titleVariants} className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {title}
            </h2>
            <motion.div
              className="mx-auto mt-6 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={isInView ? { width: '6rem', opacity: 1 } : { width: 0, opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Features grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {features.map((feature, index) => (
              <SpotlightFeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
