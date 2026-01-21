import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  Element.prototype.scrollIntoView = vi.fn();
});

const mocks = vi.hoisted(() => ({
  mockT: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'Arena.custom_model': 'Custom',
    };
    return translations[key] || key;
  }),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => mocks.mockT,
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId, size }: { providerId: string; size: number }) => (
    <span data-testid="provider-icon" data-provider={providerId} data-size={size}>
      Icon
    </span>
  ),
}));

import type { ModelOption } from '@/types/arena';
import { ModelSelectorOverlay, ModelSelectorTrigger } from './model-selector';

const mockModels: ModelOption[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    providerId: 'openai',
    isCustom: false,
    isNew: false,
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    providerId: 'anthropic',
    isCustom: false,
    isNew: true,
  },
  {
    id: 'custom-model',
    name: 'My Custom Model',
    provider: 'OpenAI',
    providerId: 'openai',
    isCustom: true,
    isNew: false,
  },
];

describe('ModelSelectorTrigger', () => {
  const defaultProps = {
    models: mockModels,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render placeholder when no model selected', () => {
    render(<ModelSelectorTrigger {...defaultProps} />);

    expect(screen.getByText('Select a model')).toBeInTheDocument();
  });

  it('should render custom placeholder', () => {
    render(<ModelSelectorTrigger {...defaultProps} placeholder="Choose your model" />);

    expect(screen.getByText('Choose your model')).toBeInTheDocument();
  });

  it('should render selected model name', () => {
    render(<ModelSelectorTrigger {...defaultProps} selectedModel="gpt-4" />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should render provider icon for selected model', () => {
    render(<ModelSelectorTrigger {...defaultProps} selectedModel="gpt-4" />);

    const icon = screen.getByTestId('provider-icon');
    expect(icon).toHaveAttribute('data-provider', 'openai');
  });

  it('should show custom badge for custom models', () => {
    render(<ModelSelectorTrigger {...defaultProps} selectedModel="custom-model" />);

    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('should show NEW badge for new models', () => {
    render(<ModelSelectorTrigger {...defaultProps} selectedModel="claude-3" />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(<ModelSelectorTrigger {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole('combobox'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should disable button when disabled prop is true', () => {
    render(<ModelSelectorTrigger {...defaultProps} disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should show remove button when showRemove is true and model is selected', () => {
    const onRemove = vi.fn();
    render(
      <ModelSelectorTrigger
        {...defaultProps}
        selectedModel="gpt-4"
        showRemove
        onRemove={onRemove}
      />,
    );

    expect(screen.getByLabelText('Remove model')).toBeInTheDocument();
  });

  it('should not show remove button when no model selected', () => {
    render(<ModelSelectorTrigger {...defaultProps} showRemove onRemove={vi.fn()} />);

    expect(screen.queryByLabelText('Remove model')).not.toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <ModelSelectorTrigger
        {...defaultProps}
        selectedModel="gpt-4"
        showRemove
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByLabelText('Remove model'));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe('ModelSelectorOverlay', () => {
  const defaultProps = {
    models: mockModels,
    isOpen: true,
    onClose: vi.fn(),
    onModelSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<ModelSelectorOverlay {...defaultProps} isOpen={false} />);

    expect(screen.queryByPlaceholderText('Search models...')).not.toBeInTheDocument();
  });

  it('should render search input when open', () => {
    render(<ModelSelectorOverlay {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument();
  });

  it('should render models grouped by provider', () => {
    render(<ModelSelectorOverlay {...defaultProps} />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
  });

  it('should render all model names', () => {
    render(<ModelSelectorOverlay {...defaultProps} />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3')).toBeInTheDocument();
    expect(screen.getByText('My Custom Model')).toBeInTheDocument();
  });

  it('should show check icon for selected model', () => {
    render(<ModelSelectorOverlay {...defaultProps} selectedModel="gpt-4" />);

    const gpt4Item = screen.getByText('GPT-4').closest('[cmdk-item]');
    expect(gpt4Item).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ModelSelectorOverlay {...defaultProps} onClose={onClose} />);

    const backdrop = container.querySelector('.bg-background\\/80');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show custom and new badges in model list', () => {
    render(<ModelSelectorOverlay {...defaultProps} />);

    const customBadges = screen.getAllByText('Custom');
    const newBadges = screen.getAllByText('NEW');

    expect(customBadges.length).toBeGreaterThan(0);
    expect(newBadges.length).toBeGreaterThan(0);
  });
});
