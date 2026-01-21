import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  ChevronDown: createMockIcon('ChevronDown'),
}));

describe('MetricSelector', () => {
  const mockOnMetricChange = vi.fn();

  const defaultMetrics = [
    {
      id: 'accuracy',
      label: 'Accuracy',
      field: 'accuracy_score',
      format: 'percentage' as const,
      higherIsBetter: true,
    },
    {
      id: 'speed',
      label: 'Speed',
      field: 'speed_score',
      format: 'number' as const,
      higherIsBetter: true,
    },
    {
      id: 'cost',
      label: 'Cost',
      field: 'cost_score',
      format: 'currency' as const,
      higherIsBetter: false,
    },
  ];

  beforeEach(() => {
    mockOnMetricChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render trigger button with selected metric', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    expect(screen.getByText('Accuracy')).toBeInTheDocument();
  });

  it('should render label when provided', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
        label="Sort by"
      />,
    );

    expect(screen.getByText('Sort by')).toBeInTheDocument();
  });

  it('should render chevron icon', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    expect(screen.getByTestId('icon-ChevronDown')).toBeInTheDocument();
  });

  it('should open dropdown when trigger is clicked', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    // Initially dropdown is closed
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(screen.getByRole('button'));

    // Now all metrics are visible
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('should close dropdown when trigger is clicked again', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    const trigger = screen.getByRole('button');

    // Open
    fireEvent.click(trigger);
    expect(screen.getByText('Speed')).toBeInTheDocument();

    // Close
    fireEvent.click(trigger);
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();
  });

  it('should call onMetricChange when option is selected', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Select Speed option
    fireEvent.click(screen.getByText('Speed'));

    expect(mockOnMetricChange).toHaveBeenCalledWith('speed');
  });

  it('should close dropdown after selection', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Speed')).toBeInTheDocument();

    // Select option
    fireEvent.click(screen.getByText('Cost'));

    // Dropdown should be closed
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();
  });

  it('should close dropdown on Escape key', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="accuracy"
        onMetricChange={mockOnMetricChange}
      />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Speed')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Dropdown should be closed
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();
  });

  it('should close dropdown on outside click', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <MetricSelector
          metrics={defaultMetrics}
          selectedMetric="accuracy"
          onMetricChange={mockOnMetricChange}
        />
      </div>,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Speed')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Dropdown should be closed
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();
  });

  it('should highlight selected metric in dropdown', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    const { container } = render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="speed"
        onMetricChange={mockOnMetricChange}
      />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Get buttons inside the dropdown (not the trigger)
    const dropdown = container.querySelector('.absolute');
    const speedButton = dropdown?.querySelector('button:nth-child(2)');

    // Selected button should have primary styling
    expect(speedButton?.className).toContain('bg-primary');
  });

  it('should show dash when no metric matches selectedMetric', async () => {
    const { MetricSelector } = await import('./MetricSelector');
    render(
      <MetricSelector
        metrics={defaultMetrics}
        selectedMetric="unknown"
        onMetricChange={mockOnMetricChange}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
