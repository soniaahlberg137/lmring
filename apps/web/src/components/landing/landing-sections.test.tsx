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
  Brain: createMockIcon('Brain'),
  Clock: createMockIcon('Clock'),
  Code2: createMockIcon('Code2'),
  Globe: createMockIcon('Globe'),
  Layers: createMockIcon('Layers'),
  MessageSquare: createMockIcon('MessageSquare'),
  Sparkles: createMockIcon('Sparkles'),
  Zap: createMockIcon('Zap'),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useInView: () => true,
  };
});

describe('HowItWorksSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render section badge', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('should render section title', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByText('From Submission to Score')).toBeInTheDocument();
  });

  it('should render all step titles', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByText('Submit Your Agent')).toBeInTheDocument();
    expect(screen.getByText('We Run the Benchmarks')).toBeInTheDocument();
    expect(screen.getByText('See Real Results')).toBeInTheDocument();
    expect(screen.getByText('Compare & Choose')).toBeInTheDocument();
  });

  it('should render step numbers', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should render step icons', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByTestId('icon-Layers')).toBeInTheDocument();
    expect(screen.getByTestId('icon-MessageSquare')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Zap')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Brain')).toBeInTheDocument();
  });
});

describe('FeaturesSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render section badge', async () => {
    const { FeaturesSection } = await import('./landing-sections');
    render(<FeaturesSection title="Everything You Need" />);

    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('should render custom title', async () => {
    const { FeaturesSection } = await import('./landing-sections');
    render(<FeaturesSection title="Everything You Need" />);

    expect(screen.getByText('Everything You Need')).toBeInTheDocument();
  });

  it('should render all feature titles', async () => {
    const { FeaturesSection } = await import('./landing-sections');
    render(<FeaturesSection title="Features" />);

    expect(screen.getByText('Domain-Specific Benchmarks')).toBeInTheDocument();
    expect(screen.getByText('Full Agent Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Performance vs Cost')).toBeInTheDocument();
    expect(screen.getByText('Verified Results')).toBeInTheDocument();
    expect(screen.getByText('Open Registry')).toBeInTheDocument();
    expect(screen.getByText('Multiple Backends')).toBeInTheDocument();
  });

  it('should render feature icons', async () => {
    const { FeaturesSection } = await import('./landing-sections');
    render(<FeaturesSection title="Features" />);

    expect(screen.getByTestId('icon-Globe')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Code2')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Clock')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Sparkles')).toBeInTheDocument();
  });
});

describe('CTASection', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render title', async () => {
    const { CTASection } = await import('./landing-sections');
    render(
      <CTASection
        title="Ready to Get Started?"
        description="Start comparing AI models today."
        primaryAction={<button type="button">Get Started</button>}
      />,
    );

    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
  });

  it('should render description', async () => {
    const { CTASection } = await import('./landing-sections');
    render(
      <CTASection
        title="Get Started"
        description="Start comparing AI models today."
        primaryAction={<button type="button">Get Started</button>}
      />,
    );

    expect(screen.getByText('Start comparing AI models today.')).toBeInTheDocument();
  });

  it('should render primary action', async () => {
    const { CTASection } = await import('./landing-sections');
    render(
      <CTASection
        title="Get Started"
        description="Description"
        primaryAction={<button type="button">Try Now</button>}
      />,
    );

    expect(screen.getByText('Try Now')).toBeInTheDocument();
  });

  it('should render secondary action when provided', async () => {
    const { CTASection } = await import('./landing-sections');
    render(
      <CTASection
        title="Get Started"
        description="Description"
        primaryAction={<button type="button">Primary</button>}
        secondaryAction={<button type="button">Secondary</button>}
      />,
    );

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  it('should not render secondary action when not provided', async () => {
    const { CTASection } = await import('./landing-sections');
    render(
      <CTASection
        title="Get Started"
        description="Description"
        primaryAction={<button type="button">Primary</button>}
      />,
    );

    expect(screen.queryByText('Secondary')).not.toBeInTheDocument();
  });
});
