import { isValidLocale, type Locale } from '@lmring/i18n';
import type { Metadata } from 'next';

import {
  AnimatedButton,
  AnimatedHero,
  CTASection,
  FeaturesSection,
  HowItWorksSection,
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
      <div className="flex min-h-screen flex-col">
        <AnimatedHero
          title={t('Index.title')}
          description={
            <>
              <span className="block text-2xl font-semibold sm:text-3xl md:text-4xl">
                <span className="bg-gradient-to-b from-stone-800 via-amber-900 to-stone-700 bg-clip-text text-transparent">
                  {t('Index.tagline')}
                </span>
              </span>
              <span className="mt-3 block text-lg text-muted-foreground sm:text-xl">
                {t('Index.subtitle')}
              </span>
            </>
          }
          actions={
            <>
              <AnimatedButton href="/leaderboard/" variant="secondary">
                {t('Index.view_leaderboard')}
              </AnimatedButton>
              <AnimatedButton href="/submit/" variant="primary">
                {t('Index.get_started')}
              </AnimatedButton>
            </>
          }
        />

        <HowItWorksSection />
        <FeaturesSection title={t('Index.features_title')} />

        <CTASection
          title="Ready to Benchmark?"
          description="Submit your agent and see how it stacks up against the rest."
          primaryAction={
            <AnimatedButton href="/submit/" variant="primary" className="px-8 py-4 text-lg">
              Submit Agent
            </AnimatedButton>
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
