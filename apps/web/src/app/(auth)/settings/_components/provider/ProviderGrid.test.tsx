import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Provider } from './types';

const { createMockIcon } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
      <svg data-testid={`icon-${name}`} data-size={size} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@lobehub/icons', () => ({
  OpenAI: {
    Avatar: createMockIcon('OpenAI.Avatar'),
  },
}));

describe('ProviderGrid', () => {
  const mockOnToggle = vi.fn();
  const mockOnSelect = vi.fn();

  const MockIcon = createMockIcon('TestProvider');

  const enabledProvider: Provider = {
    id: 'openai',
    name: 'OpenAI',
    connected: true,
    Icon: MockIcon,
    description: 'OpenAI provider',
    type: 'enabled',
    tags: ['OpenAI'],
  };

  const disabledProvider: Provider = {
    id: 'anthropic',
    name: 'Anthropic',
    connected: false,
    Icon: MockIcon,
    description: 'Anthropic provider',
    type: 'disabled',
    tags: ['Anthropic'],
  };

  const providers: Provider[] = [enabledProvider, disabledProvider];

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockOnSelect.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render enabled section heading', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('Provider.enabled')).toBeInTheDocument();
  });

  it('should render disabled section heading', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('Provider.disabled')).toBeInTheDocument();
  });

  it('should show provider count badges', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    // Should show count of providers (1 enabled, 1 disabled)
    const counts = screen.getAllByText('1');
    expect(counts).toHaveLength(2);
  });

  it('should show loading skeleton when isLoading is true', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={true}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    // Should show skeleton elements
    const skeletons = screen.getAllByTestId('provider-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show dash in badge when loading', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={true}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    // Should show '-' instead of count when loading
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBe(2); // One for each section
  });

  it('should render provider cards when not loading', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
  });

  it('should call onSelect when a provider card is clicked', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    // Click on the first card
    const cards = screen.getAllByTestId('card');
    if (cards[0]) fireEvent.click(cards[0]);

    expect(mockOnSelect).toHaveBeenCalledWith('openai');
  });

  it('should call onToggle when switch is clicked', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    const switches = screen.getAllByRole('switch');
    if (switches[0]) fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('openai');
  });

  it('should separate providers by type into correct sections', async () => {
    const multipleProviders: Provider[] = [
      { ...enabledProvider, id: 'p1', name: 'Provider1', type: 'enabled' },
      { ...enabledProvider, id: 'p2', name: 'Provider2', type: 'enabled' },
      { ...disabledProvider, id: 'p3', name: 'Provider3', type: 'disabled' },
    ];

    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={multipleProviders}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    // Enabled count should be 2
    expect(screen.getByText('2')).toBeInTheDocument();
    // Disabled count should be 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
