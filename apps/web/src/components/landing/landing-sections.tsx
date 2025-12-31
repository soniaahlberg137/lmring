'use client';

import { cn } from '@lmring/ui';
import {
  AlibabaCloud,
  Anthropic,
  Aws,
  Azure,
  Cohere,
  DeepSeek,
  Google,
  Groq,
  HuggingFace,
  Meta,
  Mistral,
  OpenAI,
  TencentCloud,
  Wenxin,
} from '@lobehub/icons';
import { motion, useInView } from 'framer-motion';
import { Brain, Clock, Code2, Globe, Layers, MessageSquare, Sparkles, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

// Provider with icons from @lobehub/icons
const providers = [
  { name: 'OpenAI', Icon: OpenAI },
  { name: 'Anthropic', Icon: Anthropic },
  { name: 'Google', Icon: Google },
  { name: 'Meta', Icon: Meta },
  { name: 'Mistral', Icon: Mistral },
  { name: 'Cohere', Icon: Cohere },
  { name: 'Groq', Icon: Groq },
  { name: 'Azure', Icon: Azure },
  { name: 'AWS', Icon: Aws },
  { name: 'Alibaba', Icon: AlibabaCloud },
  { name: 'Baidu', Icon: Wenxin },
  { name: 'Tencent', Icon: TencentCloud },
  { name: 'DeepSeek', Icon: DeepSeek },
  { name: 'HuggingFace', Icon: HuggingFace },
];

// Animated provider badge with real icons
// biome-ignore lint/suspicious/noExplicitAny: @lobehub/icons CompoundedIcon types
function ProviderBadge({ name, Icon, delay }: { name: string; Icon: any; delay: number }) {
  return (
    <motion.div
      className="group relative flex items-center gap-2 rounded-full border border-slate-600/40 bg-slate-800/50 px-4 py-2 backdrop-blur-sm transition-all hover:border-slate-500/50 hover:bg-slate-700/50"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      {Icon.Avatar ? <Icon.Avatar size={18} /> : <Icon size={18} />}
      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">{name}</span>
    </motion.div>
  );
}

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

// Providers Section
export function ProvidersSection() {
  return (
    <AnimatedSection className="relative overflow-hidden bg-slate-900 py-24">
      {/* Soft background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/30 to-slate-900" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.span
            className="inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-sm font-medium text-indigo-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Integrations
          </motion.span>
          <motion.h2
            className="mt-6 text-4xl font-bold text-slate-100 md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            50+ AI Providers
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Connect to all major AI providers including OpenAI, Anthropic, Google, Meta, and dozens
            more. One platform, unlimited possibilities.
          </motion.p>
        </div>

        {/* Provider badges grid */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {providers.map((provider, i) => (
            <ProviderBadge
              key={provider.name}
              name={provider.name}
              Icon={provider.Icon}
              delay={0.3 + i * 0.05}
            />
          ))}
          <motion.div
            className="flex items-center gap-2 rounded-full border border-dashed border-slate-600/50 px-4 py-2"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-sm text-slate-500">+38 more</span>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// How It Works Section
const steps = [
  {
    icon: Layers,
    title: 'Select Models',
    description: 'Choose up to 4 AI models from 50+ providers to compare side-by-side.',
  },
  {
    icon: MessageSquare,
    title: 'Enter Prompt',
    description: 'Write your prompt once and send it to all selected models simultaneously.',
  },
  {
    icon: Zap,
    title: 'Compare Results',
    description: 'See real-time streaming responses from all models in a unified interface.',
  },
  {
    icon: Brain,
    title: 'Analyze & Decide',
    description: 'Evaluate responses, track performance, and find the best model for your needs.',
  },
];

export function HowItWorksSection() {
  return (
    <AnimatedSection className="relative overflow-hidden bg-slate-900 py-24">
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
            className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.span>
          <motion.h2
            className="mt-6 text-4xl font-bold text-slate-100 md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Simple Yet Powerful
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Connecting line - softer */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent lg:block" />

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
                  <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/80">
                    <step.icon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-slate-100">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// Features Section - softer gradients
const features = [
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description: 'Watch responses generate live from multiple models simultaneously.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Multi-language',
    description: 'Support for English, Chinese, French and more languages.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Code2,
    title: 'API Integration',
    description: 'Bring your own API keys for complete control and privacy.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: Clock,
    title: 'History & Sharing',
    description: 'Save conversations and share comparison results with your team.',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    icon: Sparkles,
    title: 'Custom Models',
    description: 'Add custom OpenAI-compatible endpoints and local models.',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    icon: Brain,
    title: 'Smart Analysis',
    description: 'Track model performance with ELO-based leaderboards.',
    gradient: 'from-cyan-400 to-blue-500',
  },
];

export function FeaturesSection({ title }: { title: string }) {
  return (
    <AnimatedSection className="relative overflow-hidden bg-slate-900 py-24">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-indigo-500/5 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.span
            className="inline-block rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Features
          </motion.span>
          <motion.h2
            className="mt-6 text-4xl font-bold text-slate-100 md:text-5xl lg:text-6xl"
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
              className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 transition-all hover:border-slate-600/50 hover:bg-slate-800/60"
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

              <h3 className="mb-2 text-xl font-semibold text-slate-100">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// CTA Section - softer
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
    <AnimatedSection className="relative overflow-hidden bg-slate-900 py-24">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/30 via-slate-900 to-slate-900" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-500/15 via-blue-500/10 to-transparent blur-[120px]" />

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
          className="text-4xl font-bold text-slate-100 md:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-xl text-slate-400"
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
          {primaryAction}
          {secondaryAction}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
