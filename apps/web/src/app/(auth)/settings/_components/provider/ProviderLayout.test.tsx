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

vi.mock('lucide-react', () => ({
  BoxIcon: createMockIcon('BoxIcon'),
  SearchIcon: createMockIcon('SearchIcon'),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@lobehub/icons', () => ({
  OpenAI: {
    Avatar: createMockIcon('OpenAI.Avatar'),
  },
}));

vi.mock('./AddProviderDialog', () => ({
  AddProviderDialog: ({ onAdd }: { onAdd: (p: Provider) => void }) => (
    <button type="button" data-testid="add-provider-dialog" onClick={() => onAdd({} as Provider)}>
      Add Provider
    </button>
  ),
}));

vi.mock('./ProviderDetail', () => ({
  ProviderDetail: ({
    provider,
    onToggle,
  }: {
    provider: Provider;
    onToggle: (id: string) => void;
  }) => (
    <div data-testid="provider-detail">
      <span>{provider.name}</span>
      <button type="button" onClick={() => onToggle(provider.id)}>
        Toggle
      </button>
    </div>
  ),
}));

vi.mock('./ProviderGrid', () => ({
  ProviderGrid: ({
    providers,
    onSelect,
  }: {
    providers: Provider[];
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="provider-grid">
      {providers.map((p) => (
        <button type="button" key={p.id} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

describe('ProviderLayout', () => {
  const mockOnToggleProvider = vi.fn();
  const mockOnSaveProvider = vi.fn();
  const mockOnAddProvider = vi.fn();
  const mockOnDeleteProvider = vi.fn();

  const MockIcon = createMockIcon('TestProvider');

  const providers: Provider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      connected: true,
      Icon: MockIcon,
      description: 'OpenAI provider',
      type: 'enabled',
      tags: ['OpenAI'],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      connected: false,
      Icon: MockIcon,
      description: 'Anthropic provider',
      type: 'disabled',
      tags: ['Anthropic'],
    },
  ];

  beforeEach(() => {
    mockOnToggleProvider.mockClear();
    mockOnSaveProvider.mockClear();
    mockOnAddProvider.mockClear();
    mockOnDeleteProvider.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render sidebar with provider list', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    // Should show "All Providers" button
    expect(screen.getByText('Provider.all_providers')).toBeInTheDocument();
  });

  it('should render search input', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Provider.search_placeholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter providers by search query', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Provider.search_placeholder');
    fireEvent.change(searchInput, { target: { value: 'OpenAI' } });

    // Grid should only show OpenAI
    const grid = screen.getByTestId('provider-grid');
    expect(grid).toHaveTextContent('OpenAI');
  });

  it('should render provider grid when no provider is selected', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    expect(screen.getByTestId('provider-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-detail')).not.toBeInTheDocument();
  });

  it('should render provider detail when a provider is selected from sidebar', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    // Click on OpenAI in sidebar
    const openaiButton = screen.getAllByText('OpenAI')[0];
    if (openaiButton) fireEvent.click(openaiButton);

    expect(screen.getByTestId('provider-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-grid')).not.toBeInTheDocument();
  });

  it('should show loading skeleton when isLoading is true', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={true}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    const skeletons = screen.getAllByTestId('provider-sidebar-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show connected indicator for connected providers', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    const { container } = render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    // OpenAI is connected, should have green dot
    const greenDots = container.querySelectorAll('.bg-green-500');
    expect(greenDots.length).toBeGreaterThan(0);
  });

  it('should call onAddProvider when add dialog submits', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    const addButton = screen.getByTestId('add-provider-dialog');
    fireEvent.click(addButton);

    expect(mockOnAddProvider).toHaveBeenCalled();
  });

  it('should return to grid view when clicking All Providers button', async () => {
    const { ProviderLayout } = await import('./ProviderLayout');
    render(
      <ProviderLayout
        providers={providers}
        isLoading={false}
        onToggleProvider={mockOnToggleProvider}
        onSaveProvider={mockOnSaveProvider}
        onAddProvider={mockOnAddProvider}
        onDeleteProvider={mockOnDeleteProvider}
      />,
    );

    // First select a provider
    const openaiButton = screen.getAllByText('OpenAI')[0];
    if (openaiButton) fireEvent.click(openaiButton);
    expect(screen.getByTestId('provider-detail')).toBeInTheDocument();

    // Then click All Providers
    fireEvent.click(screen.getByText('Provider.all_providers'));
    expect(screen.getByTestId('provider-grid')).toBeInTheDocument();
  });
});
