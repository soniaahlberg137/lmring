import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('PublicLayout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render children', async () => {
    const { default: PublicLayout } = await import('./layout');
    render(PublicLayout({ children: <div data-testid="test-child">Content</div> }));
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render main element around children', async () => {
    const { default: PublicLayout } = await import('./layout');
    const { container } = render(PublicLayout({ children: <div>Content</div> }));
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
