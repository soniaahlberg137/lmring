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
  Globe: createMockIcon('Globe'),
  Zap: createMockIcon('Zap'),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useInView: () => true,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
    }),
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      get: () => strings.reduce((acc, str, i) => acc + str + (values[i] || ''), ''),
    }),
  };
});

describe('AnimatedFeatures', () => {
  const defaultFeatures = [
    { icon: 'zap' as const, title: 'Fast Performance', description: 'Lightning fast responses' },
    { icon: 'brain' as const, title: 'Smart AI', description: 'Intelligent assistance' },
    { icon: 'globe' as const, title: 'Global Access', description: 'Available worldwide' },
  ];

  afterEach(() => {
    cleanup();
  });

  it('should render section title', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(<AnimatedFeatures title="Our Features" features={defaultFeatures} />);

    expect(screen.getByText('Our Features')).toBeInTheDocument();
  });

  it('should render all feature titles', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(<AnimatedFeatures title="Features" features={defaultFeatures} />);

    expect(screen.getByText('Fast Performance')).toBeInTheDocument();
    expect(screen.getByText('Smart AI')).toBeInTheDocument();
    expect(screen.getByText('Global Access')).toBeInTheDocument();
  });

  it('should render all feature descriptions', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(<AnimatedFeatures title="Features" features={defaultFeatures} />);

    expect(screen.getByText('Lightning fast responses')).toBeInTheDocument();
    expect(screen.getByText('Intelligent assistance')).toBeInTheDocument();
    expect(screen.getByText('Available worldwide')).toBeInTheDocument();
  });

  it('should render feature icons', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(<AnimatedFeatures title="Features" features={defaultFeatures} />);

    expect(screen.getByTestId('icon-Zap')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Brain')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Globe')).toBeInTheDocument();
  });

  it('should render correct number of feature cards', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    const { container } = render(<AnimatedFeatures title="Features" features={defaultFeatures} />);

    // Each feature has a h3 title
    const featureTitles = container.querySelectorAll('h3');
    expect(featureTitles.length).toBe(3);
  });

  it('should render with single feature', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(
      <AnimatedFeatures
        title="Feature"
        features={[{ icon: 'zap', title: 'Single', description: 'One feature' }]}
      />,
    );

    expect(screen.getByText('Single')).toBeInTheDocument();
    expect(screen.getByText('One feature')).toBeInTheDocument();
  });

  it('should render ReactNode title', async () => {
    const { AnimatedFeatures } = await import('./animated-features');
    render(
      <AnimatedFeatures
        title={
          <span>
            Custom <strong>Title</strong>
          </span>
        }
        features={defaultFeatures}
      />,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
