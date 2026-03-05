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

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  LayoutGroup: ({ children }: any) => <>{children}</>,
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
  const mockOnAddCustom = vi.fn();

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
    mockOnAddCustom.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render section headers', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

    expect(screen.getByText('Provider.section_enabled')).toBeInTheDocument();
    expect(screen.getByText('Provider.section_available')).toBeInTheDocument();
  });

  it('should show loading skeleton when isLoading is true', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={true}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

    const skeletons = screen.getAllByTestId('provider-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render provider cards when not loading', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
  });

  it('should render add custom provider card', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

    expect(screen.getByText('Provider.add_custom_provider')).toBeInTheDocument();
  });

  it('should call onAddCustom when add custom card is clicked', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

    const addCard = screen
      .getByText('Provider.add_custom_provider')
      .closest('[data-testid="card"]');
    if (addCard) fireEvent.click(addCard);

    expect(mockOnAddCustom).toHaveBeenCalled();
  });

  it('should call onSelect when a provider card is clicked', async () => {
    const { ProviderGrid } = await import('./ProviderGrid');
    render(
      <ProviderGrid
        providers={providers}
        isLoading={false}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
        onAddCustom={mockOnAddCustom}
      />,
    );

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
        onAddCustom={mockOnAddCustom}
      />,
    );

    const switches = screen.getAllByRole('switch');
    if (switches[0]) fireEvent.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('openai');
  });
});
