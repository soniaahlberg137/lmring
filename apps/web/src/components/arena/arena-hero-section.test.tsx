import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArenaHeroSection } from './arena-hero-section';

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({
    providerId,
    size,
    className,
  }: {
    providerId: string;
    size: number;
    type: string;
    className: string;
  }) => <div data-testid={`provider-icon-${providerId}`} data-size={size} className={className} />,
}));

describe('ArenaHeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 14 featured provider icons', () => {
    render(<ArenaHeroSection />);

    const expectedProviders = [
      'openai',
      'anthropic',
      'google',
      'deepseek',
      'xai',
      'groq',
      'meta',
      'cohere',
      'mistral',
      'perplexity',
      'huggingface',
      'nvidia',
      'minimax',
      'zhipu',
    ];

    for (const provider of expectedProviders) {
      expect(screen.getByTestId(`provider-icon-${provider}`)).toBeInTheDocument();
    }
  });

  it('renders provider icons with correct size (22px)', () => {
    render(<ArenaHeroSection />);

    const providerIcons = screen.getAllByTestId(/^provider-icon-/);
    expect(providerIcons).toHaveLength(14);

    for (const icon of providerIcons) {
      expect(icon).toHaveAttribute('data-size', '22');
    }
  });

  it('renders hero title with font-normal styling', () => {
    render(<ArenaHeroSection />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('font-normal');
    expect(title).not.toHaveClass('font-bold');
  });

  it('renders hero description with text-center and whitespace-nowrap', () => {
    render(<ArenaHeroSection />);

    const description = screen.getByText(/Arena\.hero_description/);
    expect(description).toHaveClass('text-center');
    expect(description).toHaveClass('whitespace-nowrap');
  });

  it('renders leaderboard link with correct href', () => {
    render(<ArenaHeroSection />);

    const link = screen.getByRole('link', { name: 'Arena.hero_leaderboard' });
    expect(link).toHaveAttribute('href', '/leaderboard');
  });

  it('container has proper spacing classes (gap-3)', () => {
    const { container } = render(<ArenaHeroSection />);

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('gap-3');
  });
});
