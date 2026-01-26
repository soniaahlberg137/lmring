import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockT = vi.fn((key: string) => key);

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => mockT,
}));

vi.mock('@/components/arena/arena-hero-section', () => ({
  ArenaHeroSection: () => <div data-testid="arena-hero-section">Hero Section</div>,
}));

vi.mock('@/components/arena/model-tab-bar', () => ({
  ModelTabBar: ({
    comparisons,
    availableModels,
  }: {
    comparisons: Array<{ id: string; modelId: string }>;
    availableModels: Array<{ id: string }>;
  }) => (
    <div
      data-testid="model-tab-bar"
      data-comparisons-count={comparisons.length}
      data-models-count={availableModels.length}
    >
      Model Tab Bar
    </div>
  ),
}));

vi.mock('@/components/arena/prompt-input', () => ({
  PromptInput: ({
    children,
    value,
    isLoading,
  }: {
    children: React.ReactNode;
    value: string;
    isLoading: boolean;
  }) => (
    <div data-testid="prompt-input" data-value={value} data-is-loading={isLoading}>
      {children}
    </div>
  ),
  PromptInputActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prompt-input-actions">{children}</div>
  ),
  PromptInputFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prompt-input-footer">{children}</div>
  ),
  PromptInputSubmit: () => (
    <button type="button" data-testid="prompt-input-submit">
      Submit
    </button>
  ),
  PromptInputTextarea: ({ placeholder }: { placeholder: string }) => (
    <textarea data-testid="prompt-input-textarea" placeholder={placeholder} />
  ),
}));

vi.mock('@/components/arena/prompt-input-features', () => ({
  ImagePreviews: () => <div data-testid="image-previews">Image Previews</div>,
  ModeChip: () => <div data-testid="mode-chip">Mode Chip</div>,
  PromptInputFeatureButtons: () => (
    <div data-testid="prompt-input-feature-buttons">Feature Buttons</div>
  ),
}));

vi.mock('@lmring/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

const createDefaultProps = () => ({
  comparisons: [
    { id: 'comp-1', modelId: 'openai:gpt-4' },
    { id: 'comp-2', modelId: 'anthropic:claude-3' },
  ],
  availableModels: [
    {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: '',
    },
    {
      id: 'anthropic:claude-3',
      name: 'Claude 3',
      provider: 'Anthropic',
      providerId: 'anthropic',
      description: '',
    },
  ],
  globalPrompt: 'Test prompt',
  isLoading: false,
  uploadedImages: [],
  onPromptChange: vi.fn(),
  onSubmit: vi.fn(),
  onStop: vi.fn(),
  onModelSelect: vi.fn(),
  onAddComparison: vi.fn(),
  onRemoveComparison: vi.fn(),
  onAddImages: vi.fn(),
  onUpdateImage: vi.fn(),
  onRemoveImage: vi.fn().mockResolvedValue(undefined),
  onModeChange: vi.fn(),
});

describe('InitialArenaView', () => {
  it('should render ArenaHeroSection', async () => {
    const { InitialArenaView } = await import('./initial-arena-view');
    const props = createDefaultProps();

    render(<InitialArenaView {...props} />);

    expect(screen.getByTestId('arena-hero-section')).toBeInTheDocument();
  });

  it('should render PromptInput with correct props', async () => {
    const { InitialArenaView } = await import('./initial-arena-view');
    const props = createDefaultProps();

    render(<InitialArenaView {...props} />);

    const promptInput = screen.getByTestId('prompt-input');
    expect(promptInput).toBeInTheDocument();
    expect(promptInput).toHaveAttribute('data-value', 'Test prompt');
    expect(promptInput).toHaveAttribute('data-is-loading', 'false');
  });

  it('should render ModelTabBar with correct props', async () => {
    const { InitialArenaView } = await import('./initial-arena-view');
    const props = createDefaultProps();

    render(<InitialArenaView {...props} />);

    const modelTabBar = screen.getByTestId('model-tab-bar');
    expect(modelTabBar).toBeInTheDocument();
    expect(modelTabBar).toHaveAttribute('data-comparisons-count', '2');
    expect(modelTabBar).toHaveAttribute('data-models-count', '2');
  });

  it('should pass props through correctly', async () => {
    const { InitialArenaView } = await import('./initial-arena-view');
    const props = createDefaultProps();
    props.isLoading = true;
    props.globalPrompt = 'Different prompt';

    render(<InitialArenaView {...props} />);

    const promptInput = screen.getByTestId('prompt-input');
    expect(promptInput).toHaveAttribute('data-value', 'Different prompt');
    expect(promptInput).toHaveAttribute('data-is-loading', 'true');
  });

  it('should render all prompt input children components', async () => {
    const { InitialArenaView } = await import('./initial-arena-view');
    const props = createDefaultProps();

    render(<InitialArenaView {...props} />);

    expect(screen.getByTestId('image-previews')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input-footer')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input-actions')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input-feature-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('mode-chip')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input-submit')).toBeInTheDocument();
  });
});
