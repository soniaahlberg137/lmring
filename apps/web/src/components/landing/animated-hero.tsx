'use client';

import { cn } from '@lmring/ui';
import { motion, useMotionValue, useScroll, useTransform } from 'framer-motion';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useRef } from 'react';

import { ProviderIcon } from '../arena/provider-icon';

type AnimatedHeroProps = {
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  badge?: ReactNode;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const titleVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

// Floating model cards - softer styling
function FloatingModelCard({
  name,
  provider,
  providerId,
  delay,
  className,
}: {
  name: string;
  provider: string;
  providerId: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        'absolute rounded-xl border border-slate-600/30 bg-slate-800/60 px-4 py-3 backdrop-blur-md',
        'shadow-lg shadow-slate-900/20',
        className,
      )}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: [0, 1, 1, 1],
        scale: [0.8, 1, 1, 1],
        y: [20, 0, -10, 0],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 2,
        ease: 'easeInOut',
      }}
    >
      <div className="flex items-center gap-3">
        <ProviderIcon providerId={providerId} size={32} type="avatar" />
        <div>
          <p className="text-sm font-semibold text-slate-100">{name}</p>
          <p className="text-xs text-slate-400">{provider}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Animated grid lines - softer
function _AnimatedGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(148,163,184,0.06)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="hero-grid-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-grid-mask">
            <rect width="100%" height="100%" fill="url(#hero-grid-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" mask="url(#hero-grid-mask)" />
      </svg> */}

      {/* Animated vertical lines - softer indigo
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-indigo-400/15 to-transparent"
          style={{ left: `${20 + i * 15}%` }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 1.5, ease: 'easeOut' }}
        />
      ))} */}
    </div>
  );
}

// Glowing orbs - softer colors
function InteractiveOrbs() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 20;
      const y = (e.clientY - top - height / 2) / 20;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Visual effect only
    <div className="absolute inset-0 overflow-hidden" onMouseMove={handleMouseMove}>
      <motion.div
        className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]"
        style={{
          x: useTransform(mouseX, (x) => x * 2),
          y: useTransform(mouseY, (y) => y * 2),
        }}
      />
      <motion.div
        className="absolute right-1/4 top-1/3 h-[350px] w-[350px] rounded-full bg-slate-400/10 blur-[80px]"
        style={{
          x: useTransform(mouseX, (x) => x * -1.5),
          y: useTransform(mouseY, (y) => y * -1.5),
        }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-blue-400/8 blur-[90px]"
        style={{
          x: useTransform(mouseX, (x) => x * 1),
          y: useTransform(mouseY, (y) => y * 1),
        }}
      />
    </div>
  );
}

// Stats counter - softer text
function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    >
      <motion.span
        className="block text-4xl font-bold text-slate-100 md:text-5xl"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5, type: 'spring' }}
      >
        {value}
      </motion.span>
      <span className="mt-1 block text-sm text-slate-400">{label}</span>
    </motion.div>
  );
}

export function AnimatedHero({ title, description, actions, badge }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative flex min-h-screen w-full flex-col">
      <InteractiveOrbs />

      {/* Floating model cards */}
      <FloatingModelCard
        name="GPT-5.2"
        provider="OpenAI"
        providerId="openai"
        delay={1}
        className="left-[5%] top-[20%] hidden lg:block"
      />
      <FloatingModelCard
        name="Claude 4.5"
        provider="Anthropic"
        providerId="anthropic"
        delay={1.5}
        className="right-[8%] top-[25%] hidden lg:block"
      />
      <FloatingModelCard
        name="Gemini 3 Pro"
        provider="Google"
        providerId="google"
        delay={2}
        className="left-[10%] bottom-[30%] hidden lg:block"
      />
      <FloatingModelCard
        name="Llama 4"
        provider="Meta"
        providerId="meta"
        delay={2.5}
        className="right-[5%] bottom-[35%] hidden lg:block"
      />

      {/* Main content with parallax */}
      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-20"
        style={{ y, opacity }}
      >
        <motion.div
          className="flex max-w-5xl flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          {badge && (
            <motion.div variants={itemVariants} className="mb-8">
              {badge}
            </motion.div>
          )}

          {/* Title with softer gradient */}
          <motion.div variants={titleVariants} className="relative">
            <h1 className="relative text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              {/* Subtle glow */}
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent opacity-50 blur-2xl">
                {title}
              </span>
              <span className="relative bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>

            {/* Softer underline */}
            <motion.div
              className="absolute -bottom-4 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400/50 via-blue-400/50 to-indigo-400/50"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '60%', opacity: 1 }}
              transition={{ delay: 1.2, duration: 1, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="mt-10 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl md:text-2xl"
          >
            {description}
          </motion.p>

          {/* Actions */}
          <motion.div variants={itemVariants} className="mt-12 flex flex-col gap-4 sm:flex-row">
            {actions}
          </motion.div>

          {/* Stats */}
          {/* <motion.div
            variants={itemVariants}
            className="mt-20 flex flex-wrap justify-center gap-12 border-t border-slate-700/50 pt-10 md:gap-20"
          >
            <AnimatedStat value="50+" label="AI Providers" delay={1.8} />
            <AnimatedStat value="200+" label="Models" delay={2} />
            <AnimatedStat value="4" label="Side-by-side" delay={2.2} />
            <AnimatedStat value="∞" label="Comparisons" delay={2.4} />
          </motion.div> */}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.6 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <span className="text-xs uppercase tracking-widest text-slate-500">Scroll</span>
          <div className="h-10 w-6 rounded-full border border-slate-600/50 p-1">
            <motion.div
              className="h-2 w-full rounded-full bg-slate-400"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
