import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { createMockIcon, createMockProvider } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
  createMockProvider: (name: string) => {
    const MockProvider = ({ size }: { size?: number }) => (
      <div data-testid={`provider-${name}`} data-size={size} />
    );
    MockProvider.Avatar = ({ size }: { size?: number }) => (
      <div data-testid={`provider-${name}-avatar`} data-size={size} />
    );
    return MockProvider;
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

vi.mock('@lobehub/icons', () => ({
  AlibabaCloud: createMockProvider('AlibabaCloud'),
  Anthropic: createMockProvider('Anthropic'),
  Aws: createMockProvider('Aws'),
  Azure: createMockProvider('Azure'),
  Cohere: createMockProvider('Cohere'),
  DeepSeek: createMockProvider('DeepSeek'),
  Google: createMockProvider('Google'),
  Groq: createMockProvider('Groq'),
  HuggingFace: createMockProvider('HuggingFace'),
  Meta: createMockProvider('Meta'),
  Mistral: createMockProvider('Mistral'),
  OpenAI: createMockProvider('OpenAI'),
  TencentCloud: createMockProvider('TencentCloud'),
  Wenxin: createMockProvider('Wenxin'),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useInView: () => true,
  };
});

describe('ProvidersSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render section title', async () => {
    const { ProvidersSection } = await import('./landing-sections');
    render(<ProvidersSection />);

    expect(screen.getByText('50+ AI Providers')).toBeInTheDocument();
  });

  it('should render Integrations badge', async () => {
    const { ProvidersSection } = await import('./landing-sections');
    render(<ProvidersSection />);

    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('should render section description', async () => {
    const { ProvidersSection } = await import('./landing-sections');
    render(<ProvidersSection />);

    expect(
      screen.getByText(/Connect to all major AI providers including OpenAI/),
    ).toBeInTheDocument();
  });

  it('should render provider badges', async () => {
    const { ProvidersSection } = await import('./landing-sections');
    render(<ProvidersSection />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should render +38 more indicator', async () => {
    const { ProvidersSection } = await import('./landing-sections');
    render(<ProvidersSection />);

    expect(screen.getByText('+38 more')).toBeInTheDocument();
  });
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

    expect(screen.getByText('Simple Yet Powerful')).toBeInTheDocument();
  });

  it('should render all step titles', async () => {
    const { HowItWorksSection } = await import('./landing-sections');
    render(<HowItWorksSection />);

    expect(screen.getByText('Select Models')).toBeInTheDocument();
    expect(screen.getByText('Enter Prompt')).toBeInTheDocument();
    expect(screen.getByText('Compare Results')).toBeInTheDocument();
    expect(screen.getByText('Analyze & Decide')).toBeInTheDocument();
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

    expect(screen.getByText('Real-time Streaming')).toBeInTheDocument();
    expect(screen.getByText('Multi-language')).toBeInTheDocument();
    expect(screen.getByText('API Integration')).toBeInTheDocument();
    expect(screen.getByText('History & Sharing')).toBeInTheDocument();
    expect(screen.getByText('Custom Models')).toBeInTheDocument();
    expect(screen.getByText('Smart Analysis')).toBeInTheDocument();
  });

  it('should render feature icons', async () => {
    const { FeaturesSection } = await import('./landing-sections');
    render(<FeaturesSection title="Features" />);

    // Zap is used twice (Real-time Streaming in features and Compare Results in steps)
    // But we're only testing FeaturesSection
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
