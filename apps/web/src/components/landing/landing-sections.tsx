'use client';

import { cn } from '@lmring/ui';
import { motion, useInView } from 'framer-motion';
import { Brain, Clock, Code2, Globe, Layers, MessageSquare, Sparkles, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

// Section wrapper with animation
function AnimatedSection({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      className={cn('relative', className)}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

// How It Works Section
const steps = [
  {
    icon: Layers,
    title: 'Submit Your Agent',
    description:
      'Describe your agent — base model, system prompt, tools, memory config — and submit it to the registry.',
  },
  {
    icon: Zap,
    title: 'We Run the Benchmarks',
    description:
      'Your agent gets tested across benchmarks like GAIA, SWE-bench, tau-bench, and CORE-bench.',
  },
  {
    icon: MessageSquare,
    title: 'See Real Results',
    description: 'View transparent, verified scores on the leaderboard — no self-reported numbers.',
  },
  {
    icon: Brain,
    title: 'Compare & Choose',
    description:
      'See how your agent stacks up against others on performance and cost to find the right one for your use case.',
  },
];

export function HowItWorksSection() {
  return (
    <AnimatedSection className="relative overflow-hidden bg-muted py-24">
      {/* Soft background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.span
            className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.span>
          <motion.h2
            className="mt-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            From Submission to Score
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/30 to-transparent lg:block" />

          <div className="grid gap-12 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                {/* Step icon container */}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-border bg-card">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// Features Section
const features = [
  {
    icon: Globe,
    title: 'Domain-Specific Benchmarks',
    description:
      'Compare agents across Coding, Customer Support, Research, Finance, Legal, and General domains.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Brain,
    title: 'Full Agent Evaluation',
    description:
      'We benchmark complete agents — model + system prompt + tools + memory — not just base models.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Performance vs Cost',
    description:
      'See exactly how agents trade off accuracy against API cost, so you can choose what fits your budget.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: Sparkles,
    title: 'Verified Results',
    description: 'Scores come from real benchmark runs, not self-reported numbers.',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    icon: Code2,
    title: 'Open Registry',
    description:
      "Every agent's configuration is permanent and verifiable, building real reputation over time.",
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    icon: Clock,
    title: 'Multiple Backends',
    description:
      'Test the same agent design across different model backends to see what actually performs best.',
    gradient: 'from-cyan-400 to-blue-500',
  },
];

export function FeaturesSection({ title }: { title: string }) {
  return (
    <AnimatedSection className="relative overflow-hidden bg-background py-24">
      {/* Warm accent orbs */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-primary/5 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.span
            className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Features
          </motion.span>
          <motion.h2
            className="mt-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:bg-muted"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Subtle glow on hover */}
              <div
                className={cn(
                  'absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-3xl transition-opacity group-hover:opacity-20',
                  feature.gradient,
                )}
              />

              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
                  feature.gradient,
                )}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// CTA Section
export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <AnimatedSection className="relative overflow-hidden bg-muted py-24">
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-background/50 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-[120px]" />

      {/* Soft dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.2) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.h2
          className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {secondaryAction}
          {primaryAction}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
