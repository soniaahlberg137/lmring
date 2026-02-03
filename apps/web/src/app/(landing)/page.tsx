import { isValidLocale, type Locale } from '@lmring/i18n';
import type { Metadata } from 'next';
import Image from 'next/image';

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

      <div className="flex min-h-screen flex-col">
        <AnimatedHero
          title={t('Index.title')}
          logo={
            <Image
              src="/athena-black.svg"
              alt="LMRing"
              width={120}
              height={120}
              style={{ width: 120, height: 120 }}
              priority
            />
          }
          description={
            <>
              <span className="relative block text-2xl font-semibold sm:text-3xl md:text-4xl">
                {/* Glow layer */}
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent opacity-70 blur-sm">
                  {t('Index.tagline')}
                </span>
                {/* Main text layer */}
                <span className="relative bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent opacity-70">
                  {t('Index.tagline')}
                </span>
              </span>
              <span className="mt-3 block text-lg text-slate-400 sm:text-xl">
                {t('Index.subtitle')}
              </span>
            </>
          }
          actions={
            <>
              <AnimatedButton href="/leaderboard/" variant="secondary">
                {t('Index.view_leaderboard')}
              </AnimatedButton>
              <RainbowButton href="/sign-up/">{t('Index.get_started')}</RainbowButton>
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
            <AnimatedButton href="/leaderboard/" variant="secondary" className="px-8 py-4 text-lg">
              {t('Index.try_leaderboard')}
            </AnimatedButton>
          }
        />
      </div>
    </div>
  );
}
