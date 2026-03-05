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
  PlusIcon: createMockIcon('PlusIcon'),
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
  AddProviderDialog: ({
    onAdd,
    open,
    onOpenChange,
  }: {
    onAdd: (p: Provider) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <button type="button" data-testid="add-provider-dialog" onClick={() => onAdd({} as Provider)}>
      Add Provider
    </button>
  ),
}));

vi.mock('./ProviderDetailSheet', () => ({
  ProviderDetailSheet: ({
    provider,
    open,
    onToggle,
  }: {
    provider: Provider | null;
    open: boolean;
    onToggle: (id: string) => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    open && provider ? (
      <div data-testid="provider-detail-sheet">
        <span>{provider.name}</span>
        <button type="button" onClick={() => onToggle(provider.id)}>
          Toggle
        </button>
      </div>
    ) : null,
}));

vi.mock('./ProviderGrid', () => ({
  ProviderGrid: ({
    providers,
    onSelect,
    onAddCustom,
  }: {
    providers: Provider[];
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onAddCustom: () => void;
  }) => (
    <div data-testid="provider-grid">
      {providers.map((p) => (
        <button type="button" key={p.id} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
      <button type="button" data-testid="add-custom-btn" onClick={onAddCustom}>
        Add Custom
      </button>
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

  it('should render header with title', async () => {
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

    expect(screen.getByText('Settings.tabs_provider')).toBeInTheDocument();
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

    const grid = screen.getByTestId('provider-grid');
    expect(grid).toHaveTextContent('OpenAI');
    expect(grid).not.toHaveTextContent('Anthropic');
  });

  it('should render provider grid', async () => {
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
  });

  it('should open provider detail dialog when a provider is selected', async () => {
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

    const openaiButton = screen.getByText('OpenAI');
    fireEvent.click(openaiButton);

    expect(screen.getByTestId('provider-detail-sheet')).toBeInTheDocument();
    // Grid should still be visible behind the dialog
    expect(screen.getByTestId('provider-grid')).toBeInTheDocument();
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
});
