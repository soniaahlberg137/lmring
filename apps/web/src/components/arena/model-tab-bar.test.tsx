import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockT = vi.fn((key: string) => key);

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => mockT,
}));

vi.mock('@/components/arena/model-selector', () => ({
  ModelSelectorOverlay: ({
    models,
    isOpen,
    onClose,
    onModelSelect,
  }: {
    models: Array<{ id: string }>;
    isOpen: boolean;
    onClose: () => void;
    onModelSelect: (modelId: string) => void;
  }) =>
    isOpen ? (
      <div data-testid="model-selector-overlay">
        <button type="button" data-testid="close-overlay" onClick={onClose}>
          Close
        </button>
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            data-testid={`select-model-${model.id}`}
            onClick={() => onModelSelect(model.id)}
          >
            {model.id}
          </button>
        ))}
      </div>
    ) : null,
}));

vi.mock('@/components/arena/model-tab', () => ({
  ModelTab: ({
    model,
    isActive,
    canRemove,
    onClick,
    onRemove,
  }: {
    model?: { id: string; name: string };
    isActive: boolean;
    canRemove: boolean;
    onClick: () => void;
    onRemove: () => void;
  }) => (
    <div
      data-testid="model-tab"
      data-active={isActive}
      data-can-remove={canRemove}
      data-model-id={model?.id ?? 'undefined'}
    >
      <button type="button" data-testid="tab-click" onClick={onClick}>
        {model?.name ?? 'Select model'}
      </button>
      {canRemove && onRemove && (
        <button type="button" data-testid="tab-remove" onClick={onRemove}>
          Remove
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/constants/arena', () => ({
  MAX_COMPARISON_CARDS: 4,
}));

vi.mock('@lmring/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Plus: () => <svg data-testid="plus-icon" />,
}));

const createComparisons = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `comparison-${i + 1}`,
    modelId: `openai:gpt-${i + 1}`,
  }));

const createAvailableModels = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `openai:gpt-${i + 1}`,
    name: `GPT-${i + 1}`,
    provider: 'OpenAI',
    providerId: 'openai',
    description: `GPT-${i + 1} from OpenAI`,
  }));

describe('ModelTabBar', () => {
  it('should render all comparisons as ModelTab components', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(3);
    const availableModels = createAvailableModels(3);

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    const modelTabs = screen.getAllByTestId('model-tab');
    expect(modelTabs).toHaveLength(3);
  });

  it('should render add model button when under MAX_COMPARISON_CARDS', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(2);
    const availableModels = createAvailableModels(2);

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Arena.add_model')).toBeInTheDocument();
    expect(screen.getByText('Arena.add_model')).toBeInTheDocument();
  });

  it('should hide add model button when at MAX_COMPARISON_CARDS', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(4);
    const availableModels = createAvailableModels(4);

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Arena.add_model')).not.toBeInTheDocument();
  });

  it('should call onAddComparison when add button is clicked', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(2);
    const availableModels = createAvailableModels(2);
    const onAddComparison = vi.fn();

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={onAddComparison}
        onRemoveComparison={vi.fn()}
      />,
    );

    const addButton = screen.getByLabelText('Arena.add_model');
    fireEvent.click(addButton);

    expect(onAddComparison).toHaveBeenCalledTimes(1);
  });

  it('should open ModelSelectorOverlay when tab is clicked', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(2);
    const availableModels = createAvailableModels(2);

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('model-selector-overlay')).not.toBeInTheDocument();

    const tabClickButtons = screen.getAllByTestId('tab-click');
    const firstTab = tabClickButtons[0];
    expect(firstTab).toBeDefined();
    fireEvent.click(firstTab as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('model-selector-overlay')).toBeInTheDocument();
    });
  });

  it('should call onModelSelect with correct index when model is selected', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(2);
    const availableModels = createAvailableModels(2);
    const onModelSelect = vi.fn();

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={onModelSelect}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    const tabClickButtons = screen.getAllByTestId('tab-click');
    const secondTab = tabClickButtons[1];
    expect(secondTab).toBeDefined();
    fireEvent.click(secondTab as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('model-selector-overlay')).toBeInTheDocument();
    });

    const selectModelButton = screen.getByTestId('select-model-openai:gpt-1');
    fireEvent.click(selectModelButton);

    expect(onModelSelect).toHaveBeenCalledWith(1, 'openai:gpt-1');
  });

  it('should call onRemoveComparison when remove is triggered', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(2);
    const availableModels = createAvailableModels(2);
    const onRemoveComparison = vi.fn();

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={onRemoveComparison}
      />,
    );

    const removeButtons = screen.getAllByTestId('tab-remove');
    const firstRemoveButton = removeButtons[0];
    expect(firstRemoveButton).toBeDefined();
    fireEvent.click(firstRemoveButton as HTMLElement);

    expect(onRemoveComparison).toHaveBeenCalledWith(0);
  });

  it('should disable remove when only 1 comparison', async () => {
    const { ModelTabBar } = await import('./model-tab-bar');
    const comparisons = createComparisons(1);
    const availableModels = createAvailableModels(1);

    render(
      <ModelTabBar
        comparisons={comparisons}
        availableModels={availableModels}
        onModelSelect={vi.fn()}
        onAddComparison={vi.fn()}
        onRemoveComparison={vi.fn()}
      />,
    );

    const modelTab = screen.getByTestId('model-tab');
    expect(modelTab).toHaveAttribute('data-can-remove', 'false');
  });
});
