import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
    }),
    useMotionTemplate: () => ({
      get: () => 'radial-gradient(650px circle at 0px 0px, rgba(0,0,0,0.15), transparent 80%)',
    }),
  };
});

describe('Spotlight', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { Spotlight } = await import('./spotlight');
    render(
      <Spotlight>
        <p>Spotlight Content</p>
      </Spotlight>,
    );
    expect(screen.getByText('Spotlight Content')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { Spotlight } = await import('./spotlight');
    const { container } = render(<Spotlight className="spotlight-custom">Content</Spotlight>);
    expect(container.firstChild).toHaveClass('spotlight-custom');
  });

  it('should have group and relative classes', async () => {
    const { Spotlight } = await import('./spotlight');
    const { container } = render(<Spotlight>Content</Spotlight>);
    expect(container.firstChild).toHaveClass('group');
    expect(container.firstChild).toHaveClass('relative');
  });
});

describe('SpotlightCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { SpotlightCard } = await import('./spotlight');
    render(
      <SpotlightCard>
        <p>Card Content</p>
      </SpotlightCard>,
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { SpotlightCard } = await import('./spotlight');
    const { container } = render(<SpotlightCard className="card-custom">Content</SpotlightCard>);
    expect(container.firstChild).toHaveClass('card-custom');
  });

  it('should have group and rounded classes', async () => {
    const { SpotlightCard } = await import('./spotlight');
    const { container } = render(<SpotlightCard>Content</SpotlightCard>);
    expect(container.firstChild).toHaveClass('group');
    expect(container.firstChild).toHaveClass('rounded-2xl');
  });

  it('should have card background class', async () => {
    const { SpotlightCard } = await import('./spotlight');
    const { container } = render(<SpotlightCard>Content</SpotlightCard>);
    expect(container.firstChild).toHaveClass('bg-card');
  });
});
