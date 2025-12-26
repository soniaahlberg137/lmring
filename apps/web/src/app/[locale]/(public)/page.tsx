import type { Locale } from '@lmring/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  AnimatedButton,
  AnimatedHero,
  CTASection,
  FeaturesSection,
  HowItWorksSection,
  ProvidersSection,
  RainbowButton,
  ShaderBackground,
} from '@/components/landing';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IIndexProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: 'Index',
  });

  return (
    <ShaderBackground className="min-h-screen">
      <div className="flex min-h-screen flex-col">
        {/* Hero Section with Aurora Background */}
        <AnimatedHero
          title={t('title')}
          description={t('description')}
          badge={
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              AI Model Arena
            </span>
          }
          actions={
            <>
              <RainbowButton href="/sign-up/">{t('get_started')}</RainbowButton>
              <AnimatedButton href="/arena/" variant="secondary">
                {t('view_arena')}
              </AnimatedButton>
            </>
          }
        />

        {/* Providers Section */}
        <ProvidersSection />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Features Section */}
        <FeaturesSection title={t('features_title')} />

        {/* CTA Section */}
        <CTASection
          title="Ready to Compare?"
          description="Start comparing AI models side-by-side and find the perfect fit for your use case."
          primaryAction={
            <RainbowButton href="/sign-up/" className="px-8 py-4 text-lg">
              Get Started Free
            </RainbowButton>
          }
          secondaryAction={
            <AnimatedButton href="/arena/" variant="secondary" className="px-8 py-4 text-lg">
              Try the Arena
            </AnimatedButton>
          }
        />
      </div>
    </ShaderBackground>
  );
}
