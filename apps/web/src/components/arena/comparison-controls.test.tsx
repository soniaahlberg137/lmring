import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComparisonControls } from './comparison-controls';

describe('ComparisonControls', () => {
  const defaultProps = {
    modelCount: 2,
    onAddModel: vi.fn(),
    onRemoveModel: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render model count badge', () => {
    render(<ComparisonControls {...defaultProps} />);

    expect(screen.getByText('2 Models Selected')).toBeInTheDocument();
  });

  it('should render singular form for single model', () => {
    render(<ComparisonControls {...defaultProps} modelCount={1} />);

    expect(screen.getByText('1 Model Selected')).toBeInTheDocument();
  });

  it('should show add button when under max models', () => {
    render(<ComparisonControls {...defaultProps} modelCount={2} maxModels={5} />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should hide add button when at max models', () => {
    render(<ComparisonControls {...defaultProps} modelCount={5} maxModels={5} />);

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('should call onAddModel when add button is clicked', () => {
    const onAddModel = vi.fn();
    render(<ComparisonControls {...defaultProps} onAddModel={onAddModel} />);

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onAddModel).toHaveBeenCalledTimes(1);
  });

  it('should show remove buttons when above min models', () => {
    render(<ComparisonControls {...defaultProps} modelCount={3} minModels={2} />);

    const removeButtons = screen.getAllByLabelText(/remove model/i);
    expect(removeButtons.length).toBe(3);
  });

  it('should not show remove buttons when at min models', () => {
    render(<ComparisonControls {...defaultProps} modelCount={2} minModels={2} />);

    expect(screen.queryByLabelText(/remove model/i)).not.toBeInTheDocument();
  });

  it('should call onRemoveModel with correct index when remove button is clicked', () => {
    const onRemoveModel = vi.fn();
    render(
      <ComparisonControls
        {...defaultProps}
        modelCount={3}
        minModels={2}
        onRemoveModel={onRemoveModel}
      />,
    );

    const removeButtons = screen.getAllByLabelText(/remove model/i);
    if (removeButtons[1]) {
      fireEvent.click(removeButtons[1]);
    }

    expect(onRemoveModel).toHaveBeenCalledWith(1);
  });

  it('should show shuffle button when provided and modelCount > 1', () => {
    const onShuffleModels = vi.fn();
    render(<ComparisonControls {...defaultProps} onShuffleModels={onShuffleModels} />);

    expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument();
  });

  it('should not show shuffle button when modelCount is 1', () => {
    const onShuffleModels = vi.fn();
    render(
      <ComparisonControls {...defaultProps} modelCount={1} onShuffleModels={onShuffleModels} />,
    );

    expect(screen.queryByRole('button', { name: /shuffle/i })).not.toBeInTheDocument();
  });

  it('should call onShuffleModels when shuffle button is clicked', () => {
    const onShuffleModels = vi.fn();
    render(<ComparisonControls {...defaultProps} onShuffleModels={onShuffleModels} />);

    fireEvent.click(screen.getByRole('button', { name: /shuffle/i }));

    expect(onShuffleModels).toHaveBeenCalledTimes(1);
  });

  it('should show copy button when provided', () => {
    const onCopyComparison = vi.fn();
    render(<ComparisonControls {...defaultProps} onCopyComparison={onCopyComparison} />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should call onCopyComparison when copy button is clicked', () => {
    const onCopyComparison = vi.fn();
    render(<ComparisonControls {...defaultProps} onCopyComparison={onCopyComparison} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(onCopyComparison).toHaveBeenCalledTimes(1);
  });

  it('should show export button when provided', () => {
    const onExportComparison = vi.fn();
    render(<ComparisonControls {...defaultProps} onExportComparison={onExportComparison} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should call onExportComparison when export button is clicked', () => {
    const onExportComparison = vi.fn();
    render(<ComparisonControls {...defaultProps} onExportComparison={onExportComparison} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(onExportComparison).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <ComparisonControls
        {...defaultProps}
        isLoading
        onShuffleModels={vi.fn()}
        onCopyComparison={vi.fn()}
        onExportComparison={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /shuffle/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('should use default maxModels from constants', () => {
    render(<ComparisonControls {...defaultProps} modelCount={4} />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });
});
