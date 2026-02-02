import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import Index, { generateMetadata } from './page';

vi.mock('@lmring/i18n', () => ({
  isValidLocale: (locale: string) => locale === 'en' || locale === 'fr',
}));

vi.mock('@/libs/server-translations', () => ({
  getServerTranslations: async (locale: string) => (key: string) => `${locale}:${key}`,
}));

vi.mock('@/components/landing', () => ({
  AnimatedButton: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  AnimatedHero: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description: string;
    actions: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{actions}</div>
    </section>
  ),
  CTASection: ({ title }: { title: string }) => <section>{title}</section>,
  FeaturesSection: ({ title }: { title: string }) => <section>{title}</section>,
  HowItWorksSection: () => <section>HowItWorksSection</section>,
  ProvidersSection: () => <section>ProvidersSection</section>,
  RainbowButton: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  WebGLBackground: () => <canvas data-testid="webgl" />,
}));

describe('Landing Index Page', () => {
  it('generateMetadata uses locale when valid', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'fr' }) });

    expect(meta.title).toBe('fr:Index.meta_title');
    expect(meta.description).toBe('fr:Index.meta_description');
  });

  it('generateMetadata falls back to en when locale invalid', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'xx' }) });

    expect(meta.title).toBe('en:Index.meta_title');
    expect(meta.description).toBe('en:Index.meta_description');
  });

  it('renders hero and sections with translations', async () => {
    const element = await Index({ params: Promise.resolve({ locale: 'en' }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('en:Index.title');
    expect(html).toContain('en:Index.tagline');
    expect(html).toContain('en:Index.subtitle');
    expect(html).toContain('en:Index.view_leaderboard');
    expect(html).toContain('en:Index.get_started');
    expect(html).toContain('ProvidersSection');
    expect(html).toContain('HowItWorksSection');
  });
});
