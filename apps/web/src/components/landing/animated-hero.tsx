'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRef } from 'react';

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

export function AnimatedHero({ title, description, actions, badge }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col bg-background"
    >
      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4"
        style={{ y, opacity }}
      >
        <motion.div
          className="flex max-w-5xl flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {badge && (
            <motion.div variants={itemVariants} className="mb-8">
              {badge}
            </motion.div>
          )}

          <h1 className="sr-only">{title}</h1>

          <motion.div variants={itemVariants} className="mt-10 max-w-2xl leading-relaxed">
            {description}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 flex flex-col gap-4 sm:flex-row">
            {actions}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
