import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { createMockIcon } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
}));

vi.mock('lucide-react', () => ({
  ArrowRight: createMockIcon('ArrowRight'),
}));

describe('AnimatedButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(<AnimatedButton href="/test">Click me</AnimatedButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render as a link with correct href', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(<AnimatedButton href="/dashboard">Go to Dashboard</AnimatedButton>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('should show arrow by default for primary variant', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(
      <AnimatedButton href="/test" variant="primary">
        Primary
      </AnimatedButton>,
    );
    expect(screen.getByTestId('icon-ArrowRight')).toBeInTheDocument();
  });

  it('should hide arrow when showArrow is false', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(
      <AnimatedButton href="/test" variant="primary" showArrow={false}>
        No Arrow
      </AnimatedButton>,
    );
    expect(screen.queryByTestId('icon-ArrowRight')).not.toBeInTheDocument();
  });

  it('should not show arrow for secondary variant', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(
      <AnimatedButton href="/test" variant="secondary">
        Secondary
      </AnimatedButton>,
    );
    expect(screen.queryByTestId('icon-ArrowRight')).not.toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { AnimatedButton } = await import('./animated-button');
    render(
      <AnimatedButton href="/test" className="custom-button">
        Custom
      </AnimatedButton>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-button');
  });
});

describe('GlowButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { GlowButton } = await import('./animated-button');
    render(<GlowButton href="/test">Glow Text</GlowButton>);
    expect(screen.getByText('Glow Text')).toBeInTheDocument();
  });

  it('should render as a link with correct href', async () => {
    const { GlowButton } = await import('./animated-button');
    render(<GlowButton href="/glow">Go Glow</GlowButton>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/glow');
  });

  it('should apply custom className', async () => {
    const { GlowButton } = await import('./animated-button');
    render(
      <GlowButton href="/test" className="glow-custom">
        Glow
      </GlowButton>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('glow-custom');
  });
});

describe('RainbowButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', async () => {
    const { RainbowButton } = await import('./animated-button');
    render(<RainbowButton href="/test">Rainbow Text</RainbowButton>);
    expect(screen.getByText('Rainbow Text')).toBeInTheDocument();
  });

  it('should render as a link with correct href', async () => {
    const { RainbowButton } = await import('./animated-button');
    render(<RainbowButton href="/rainbow">Go Rainbow</RainbowButton>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/rainbow');
  });

  it('should apply custom className', async () => {
    const { RainbowButton } = await import('./animated-button');
    render(
      <RainbowButton href="/test" className="rainbow-custom">
        Rainbow
      </RainbowButton>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('rainbow-custom');
  });
});
