'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '../../utils';

export type FloatingCardProps = {
  /** Card title/name */
  name: string;
  /** Card subtitle/description */
  description?: string;
  /** Icon element to display */
  icon?: ReactNode;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Additional class names */
  className?: string;
};

/**
 * A floating card component with smooth animation effects.
 * Commonly used in hero sections to showcase items like AI models, features, etc.
 *
 * @example
 * ```tsx
 * <FloatingCard
 *   name="GPT-4"
 *   description="OpenAI"
 *   icon={<OpenAIIcon size={32} />}
 *   delay={1}
 *   className="left-[5%] top-[20%]"
 * />
 * ```
 */
export function FloatingCard({
  name,
  description,
  icon,
  delay = 0,
  duration = 4,
  className,
}: FloatingCardProps) {
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
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 2,
        ease: 'easeInOut',
      }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-semibold text-slate-100">{name}</p>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
      </div>
    </motion.div>
  );
}
