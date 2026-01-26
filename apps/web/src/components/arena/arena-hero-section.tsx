'use client';

import Link from 'next/link';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { useTranslations } from '@/hooks/use-translations';

const FEATURED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'xai',
  'groq',
  'meta',
  'cohere',
  'mistral',
  'perplexity',
  'huggingface',
  'nvidia',
  'minimax',
  'zhipu',
];

export function ArenaHeroSection() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Provider Icons */}
      <div className="flex items-center gap-2">
        {FEATURED_PROVIDERS.map((provider) => (
          <ProviderIcon
            key={provider}
            providerId={provider}
            size={22}
            type="avatar"
            className="rounded-md"
          />
        ))}
      </div>

      {/* Headline */}
      <h1 className="text-text-secondary text-[32px] font-normal sm:text-5xl">
        {t('Arena.hero_title')}
      </h1>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center whitespace-nowrap mb-2">
        {t('Arena.hero_description')}{' '}
        <Link href="/leaderboard" className="text-blue-500 hover:underline">
          {t('Arena.hero_leaderboard')}
        </Link>
      </p>
    </div>
  );
}
