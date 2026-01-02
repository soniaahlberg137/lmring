import { isValidLocale, type Locale } from '@lmring/i18n';
import type { Metadata } from 'next';

import {
  AnimatedButton,
  AnimatedHero,
  CTASection,
  FeaturesSection,
  HowItWorksSection,
  ProvidersSection,
  RainbowButton,
  WebGLBackground,
} from '@/components/landing';
import { getServerTranslations } from '@/libs/server-translations';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IIndexProps): Promise<Metadata> {
  const { locale } = await props.params;
  const validLocale: Locale = isValidLocale(locale) ? locale : 'en';
  const t = await getServerTranslations(validLocale);

  return {
    title: t('Index.meta_title'),
    description: t('Index.meta_description'),
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  const validLocale: Locale = isValidLocale(locale) ? locale : 'en';
  const t = await getServerTranslations(validLocale);

  return (
    <div className="relative min-h-screen">
      <WebGLBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AnimatedHero
          title={t('Index.title')}
          description={t('Index.description')}
          badge={
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              AI Model Arena
            </span>
          }
          actions={
            <>
              <RainbowButton href="/sign-up/">{t('Index.get_started')}</RainbowButton>
              <AnimatedButton href="/arena/" variant="secondary">
                {t('Index.view_arena')}
              </AnimatedButton>
            </>
          }
        />

        <ProvidersSection />
        <HowItWorksSection />
        <FeaturesSection title={t('Index.features_title')} />

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
    </div>
  );
}
