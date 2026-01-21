import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: (_value: unknown, _range?: unknown, output?: unknown[]) => ({
      get: () => (output ? output[0] : '0%'),
    }),
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
    }),
  };
});

describe('AnimatedHero', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render title', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome to LMRing"
        description="AI comparison platform"
        actions={<button type="button">Get Started</button>}
      />,
    );

    // Title appears multiple times due to glow effect
    const titles = screen.getAllByText('Welcome to LMRing');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should render description', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="AI comparison platform"
        actions={<button type="button">Get Started</button>}
      />,
    );

    expect(screen.getByText('AI comparison platform')).toBeInTheDocument();
  });

  it('should render actions', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Get Started</button>}
      />,
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('should render badge when provided', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Action</button>}
        badge={<span>New Feature</span>}
      />,
    );

    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });

  it('should not render badge when not provided', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Action</button>}
      />,
    );

    expect(screen.queryByText('New Feature')).not.toBeInTheDocument();
  });

  it('should render scroll indicator', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Action</button>}
      />,
    );

    expect(screen.getByText('Scroll')).toBeInTheDocument();
  });

  it('should render multiple actions', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={
          <>
            <button type="button">Primary</button>
            <button type="button">Secondary</button>
          </>
        }
      />,
    );

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  it('should render title with glow effect layers', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    render(
      <AnimatedHero
        title="Test Glow Title"
        description="Description"
        actions={<button type="button">Action</button>}
      />,
    );

    const titles = screen.getAllByText('Test Glow Title');
    expect(titles.length).toBe(2);

    const glowLayer = titles[0];
    expect(glowLayer).toHaveClass('opacity-50', 'blur-2xl');

    const visibleLayer = titles[1];
    expect(visibleLayer).toHaveClass('relative');
  });

  it('should render InteractiveOrbs container with mouse event handler', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    const { container } = render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Action</button>}
      />,
    );

    const orbsContainer = container.querySelector('.absolute.inset-0.overflow-hidden');
    expect(orbsContainer).toBeInTheDocument();

    const orbElements = orbsContainer?.querySelectorAll('.rounded-full');
    expect(orbElements?.length).toBe(3);
  });

  it('should handle mouse move on InteractiveOrbs container', async () => {
    const { AnimatedHero } = await import('./animated-hero');
    const { fireEvent } = await import('@testing-library/react');
    const { container } = render(
      <AnimatedHero
        title="Welcome"
        description="Description"
        actions={<button type="button">Action</button>}
      />,
    );

    const orbsContainer = container.querySelector('.absolute.inset-0.overflow-hidden');
    expect(orbsContainer).toBeInTheDocument();

    const mockGetBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
    });
    Object.defineProperty(orbsContainer, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
    });

    fireEvent.mouseMove(orbsContainer as Element, { clientX: 500, clientY: 400 });

    expect(mockGetBoundingClientRect).toHaveBeenCalled();
  });
});
