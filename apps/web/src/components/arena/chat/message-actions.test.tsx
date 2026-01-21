import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageActions } from './message-actions';

describe('MessageActions', () => {
  const mockContent = 'Test message content';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should render copy button', () => {
    render(<MessageActions content={mockContent} />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should copy content to clipboard when copy button is clicked', async () => {
    render(<MessageActions content={mockContent} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockContent);
    });
  });

  it('should show copied state after clicking copy', async () => {
    vi.useFakeTimers();
    render(<MessageActions content={mockContent} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockContent);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should render retry button when showRetry is true and onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<MessageActions content={mockContent} onRetry={onRetry} showRetry />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should not render retry button when showRetry is false', () => {
    const onRetry = vi.fn();
    render(<MessageActions content={mockContent} onRetry={onRetry} showRetry={false} />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<MessageActions content={mockContent} showRetry />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<MessageActions content={mockContent} onRetry={onRetry} showRetry />);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render maximize button when onMaximize is provided', () => {
    const onMaximize = vi.fn();
    render(<MessageActions content={mockContent} onMaximize={onMaximize} />);

    expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
  });

  it('should not render maximize button when onMaximize is not provided', () => {
    render(<MessageActions content={mockContent} />);

    expect(screen.queryByRole('button', { name: /maximize/i })).not.toBeInTheDocument();
  });

  it('should call onMaximize when maximize button is clicked', () => {
    const onMaximize = vi.fn();
    render(<MessageActions content={mockContent} onMaximize={onMaximize} />);

    fireEvent.click(screen.getByRole('button', { name: /maximize/i }));

    expect(onMaximize).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(<MessageActions content={mockContent} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle clipboard error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));

    render(<MessageActions content={mockContent} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
