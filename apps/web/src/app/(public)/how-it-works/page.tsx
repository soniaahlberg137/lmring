import { Button } from '@lmring/ui';
import { CheckCircle, Keyboard, MessageCircle, Trophy, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getRequestLocale } from '@/libs/request-locale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getTranslations({
    locale,
  });

  return {
    title: t('HowItWorks.meta_title'),
    description: t('HowItWorks.meta_description'),
  };
}

export default async function HowItWorksPage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
  });

  const steps = [
    {
      number: 1,
      icon: Keyboard,
      title: t('HowItWorks.step_1_title'),
      description: t('HowItWorks.step_1_description'),
    },
    {
      number: 2,
      icon: MessageCircle,
      title: t('HowItWorks.step_2_title'),
      description: t('HowItWorks.step_2_description'),
    },
    {
      number: 3,
      icon: CheckCircle,
      title: t('HowItWorks.step_3_title'),
      description: t('HowItWorks.step_3_description'),
    },
    {
      number: 4,
      icon: Trophy,
      title: t('HowItWorks.step_4_title'),
      description: t('HowItWorks.step_4_description'),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center bg-background px-4 py-20 text-center">
        <h1 className="max-w-4xl text-3xl font-normal tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t('HowItWorks.hero_title')}
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">{t('HowItWorks.hero_description')}</p>
        <div className="mt-10">
          <a
            href="https://github.com/llm-ring/lmring"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Users className="h-4 w-4" />
            {t('HowItWorks.about_us')}
          </a>
        </div>
      </section>

      {/* Steps Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex gap-8">
                {/* Connecting line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 h-full w-0.5 bg-border" />
                )}

                {/* Icon circle */}
                <div className="flex-none">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-16">
                  <h3 className="mb-3 text-2xl font-semibold">{step.title}</h3>
                  <p className="text-lg text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-foreground">{t('HowItWorks.cta_title')}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">{t('HowItWorks.cta_description')}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/sign-up/">
              <Button size="lg" className="w-full sm:w-auto">
                {t('HowItWorks.cta_get_started')}
              </Button>
            </Link>
            <Link href="/arena/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('HowItWorks.cta_try_arena')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
