import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuspendedPostHogPageView } from './PostHogPageView';

const mockCapture = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
  useSearchParams: () => ({
    toString: () => 'param=value',
  }),
}));

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: mockCapture,
  }),
}));

describe('SuspendedPostHogPageView', () => {
  beforeEach(() => {
    mockCapture.mockClear();
    Object.defineProperty(window, 'origin', {
      value: 'https://example.com',
      writable: true,
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<SuspendedPostHogPageView />);
    expect(container).toBeInTheDocument();
  });

  it('should capture pageview with correct URL', () => {
    render(<SuspendedPostHogPageView />);

    expect(mockCapture).toHaveBeenCalledWith('$pageview', {
      $current_url: 'https://example.com/test-path?param=value',
    });
  });

  it('should return null (no visible content)', () => {
    const { container } = render(<SuspendedPostHogPageView />);
    expect(container.firstChild).toBeNull();
  });
});

describe('PostHogPageView URL construction', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCapture.mockClear();
  });

  it('should construct URL without search params when empty', async () => {
    vi.doMock('next/navigation', () => ({
      usePathname: () => '/another-path',
      useSearchParams: () => ({
        toString: () => '',
      }),
    }));

    const { SuspendedPostHogPageView: View } = await import('./PostHogPageView');
    render(<View />);

    expect(mockCapture).toHaveBeenCalledWith('$pageview', {
      $current_url: 'https://example.com/another-path',
    });
  });
});
