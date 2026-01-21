import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from './index';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
  }),
}));

vi.mock('sonner', () => ({
  Toaster: ({ theme, className, icons, style, ...props }: Record<string, unknown>) => (
    <div
      data-testid="sonner-toaster"
      data-theme={theme}
      data-classname={className}
      data-has-icons={!!icons}
      {...props}
    />
  ),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('Toaster', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render after mount', async () => {
    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });
  });

  it('should pass theme to Sonner', async () => {
    render(<Toaster />);

    await waitFor(() => {
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-theme', 'light');
    });
  });

  it('should have correct className', async () => {
    render(<Toaster />);

    await waitFor(() => {
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-classname', 'toaster group');
    });
  });

  it('should have icons configured', async () => {
    render(<Toaster />);

    await waitFor(() => {
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-has-icons', 'true');
    });
  });
});
