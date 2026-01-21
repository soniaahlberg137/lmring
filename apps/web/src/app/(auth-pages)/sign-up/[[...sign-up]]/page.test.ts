import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import SignUpPage, { generateMetadata } from './page';

vi.mock('@/libs/request-locale', () => ({
  getRequestLocale: async () => 'en',
}));

vi.mock('@/libs/server-translations', () => ({
  getServerTranslations: async (_locale: string) => (key: string) => key,
}));

vi.mock('@/components/auth', () => ({
  AuthFormWrapper: ({ type, callbackUrl }: { type: string; callbackUrl?: string }) =>
    React.createElement('div', {
      'data-testid': 'auth-form-wrapper',
      'data-type': type,
      'data-callback-url': callbackUrl,
    }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

describe('SignUp Page', () => {
  it('generateMetadata uses translations', async () => {
    const meta = await generateMetadata();

    expect(meta.title).toBe('SignUp.meta_title');
    expect(meta.description).toBe('SignUp.meta_description');
  });

  it('defaults callbackUrl to /arena', async () => {
    const element = await SignUpPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('data-type="signup"');
    expect(html).toContain('data-callback-url="/arena"');
  });

  it('passes callbackUrl through when provided', async () => {
    const element = await SignUpPage({
      searchParams: Promise.resolve({ callbackUrl: '/after-signup' }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('data-callback-url="/after-signup"');
  });
});
