import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockInit = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    init: mockInit,
  },
}));

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ph-provider">{children}</div>
  ),
}));

vi.mock('./PostHogPageView', () => ({
  SuspendedPostHogPageView: () => <div data-testid="page-view" />,
}));

describe('PostHogProvider', () => {
  afterEach(() => {
    cleanup();
    vi.resetModules();
    mockInit.mockClear();
  });

  it('should render children', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_POSTHOG_KEY: 'test-key',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://posthog.example.com',
      },
    }));

    const { PostHogProvider } = await import('./PostHogProvider');

    render(
      <PostHogProvider>
        <div data-testid="child">Child Content</div>
      </PostHogProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render PostHogProvider wrapper when key is present', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_POSTHOG_KEY: 'test-key',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://posthog.example.com',
      },
    }));

    const { PostHogProvider } = await import('./PostHogProvider');

    render(
      <PostHogProvider>
        <div>Content</div>
      </PostHogProvider>,
    );

    expect(screen.getByTestId('ph-provider')).toBeInTheDocument();
  });

  it('should render SuspendedPostHogPageView when key is present', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_POSTHOG_KEY: 'test-key',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://posthog.example.com',
      },
    }));

    const { PostHogProvider } = await import('./PostHogProvider');

    render(
      <PostHogProvider>
        <div>Content</div>
      </PostHogProvider>,
    );

    expect(screen.getByTestId('page-view')).toBeInTheDocument();
  });

  it('should render children directly when key is not present', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_POSTHOG_KEY: undefined,
      },
    }));

    const { PostHogProvider } = await import('./PostHogProvider');

    render(
      <PostHogProvider>
        <div data-testid="direct-child">Direct Child</div>
      </PostHogProvider>,
    );

    expect(screen.getByTestId('direct-child')).toBeInTheDocument();
  });
});
