import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import HowItWorksPage, { generateMetadata } from './page';

vi.mock('@/libs/request-locale', () => ({
  getRequestLocale: async () => 'en',
}));

vi.mock('@/libs/server-translations', () => ({
  getServerTranslations: async (_locale: string) => (key: string) => key,
}));

// @lmring/ui is mocked globally via alias in vitest.config.mts

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

describe('HowItWorks Page', () => {
  it('generateMetadata uses translations', async () => {
    const meta = await generateMetadata();

    expect(meta.title).toBe('HowItWorks.meta_title');
    expect(meta.description).toBe('HowItWorks.meta_description');
  });

  it('renders steps and cta text', async () => {
    const element = await HowItWorksPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('HowItWorks.hero_title');
    expect(html).toContain('HowItWorks.hero_description');
    expect(html).toContain('HowItWorks.step_1_title');
    expect(html).toContain('HowItWorks.step_4_description');
    expect(html).toContain('HowItWorks.cta_get_started');
    expect(html).toContain('HowItWorks.cta_try_arena');
  });
});
