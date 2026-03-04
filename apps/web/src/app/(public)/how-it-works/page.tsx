import { Button } from '@lmring/ui';
import { CheckCircle, Keyboard, MessageCircle, Sparkles, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('HowItWorks.meta_title'),
    description: t('HowItWorks.meta_description'),
  };
}

export default async function HowItWorksPage() {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

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
      <section className="flex flex-col items-center justify-center gap-6 px-4 pt-24 pb-16 text-center">
        <Link href="/">
          <Image src="/athena-black.svg" alt="Athena" width={56} height={56} />
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-600">
          <Sparkles className="h-4 w-4" />4 Simple Steps
        </span>
        <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-zinc-900 md:text-5xl">
          {t('HowItWorks.hero_title')}
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 md:text-xl">
          {t('HowItWorks.hero_description')}
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <div key={step.number} className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-blue-50">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 bg-zinc-200" />}
                </div>

                <div className={`flex-1 pt-3 ${isLast ? 'pb-0' : 'pb-12'}`}>
                  <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    STEP {step.number}
                  </span>
                  <h3 className="mt-2 mb-3 text-xl font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-base leading-relaxed text-zinc-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-zinc-200 bg-slate-50 py-16 px-12 text-center md:px-20">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900">{t('HowItWorks.cta_title')}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-zinc-500">
            {t('HowItWorks.cta_description')}
          </p>
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
