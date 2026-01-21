import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/analytics/PostHogProvider', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}));

vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock('@/libs/load-locale-messages', () => ({
  loadLocaleMessages: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/libs/request-locale', () => ({
  getRequestLocale: vi.fn().mockResolvedValue('en'),
}));

vi.mock('@/providers', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock('@/providers/language-provider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="language-provider">{children}</div>
  ),
}));

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('RootLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children within providers', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(
      await RootLayout({ children: <div data-testid="test-child">Test Content</div> }),
    );

    expect(container.querySelector('[data-testid="test-child"]')).toBeInTheDocument();
  });

  it('should render ThemeProvider', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(await RootLayout({ children: <div>Content</div> }));

    expect(container.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument();
  });

  it('should render QueryProvider', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(await RootLayout({ children: <div>Content</div> }));

    expect(container.querySelector('[data-testid="query-provider"]')).toBeInTheDocument();
  });

  it('should render LanguageProvider', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(await RootLayout({ children: <div>Content</div> }));

    expect(container.querySelector('[data-testid="language-provider"]')).toBeInTheDocument();
  });

  it('should render PostHogProvider', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(await RootLayout({ children: <div>Content</div> }));

    expect(container.querySelector('[data-testid="posthog-provider"]')).toBeInTheDocument();
  });

  it('should render Toaster', async () => {
    const { default: RootLayout } = await import('./layout');
    const { container } = render(await RootLayout({ children: <div>Content</div> }));

    expect(container.querySelector('[data-testid="toaster"]')).toBeInTheDocument();
  });
});
