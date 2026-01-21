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
  BarChart3Icon: createMockIcon('BarChart3Icon'),
  ScatterChartIcon: createMockIcon('ScatterChartIcon'),
  TableIcon: createMockIcon('TableIcon'),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ViewToggle', () => {
  const mockOnViewModeChange = vi.fn();

  beforeEach(() => {
    mockOnViewModeChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render all three view mode buttons', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />);

    expect(screen.getByTestId('icon-TableIcon')).toBeInTheDocument();
    expect(screen.getByTestId('icon-BarChart3Icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon-ScatterChartIcon')).toBeInTheDocument();
  });

  it('should render buttons with correct titles', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('title', 'Leaderboard.view_table');
    expect(buttons[1]).toHaveAttribute('title', 'Leaderboard.view_bar_chart');
    expect(buttons[2]).toHaveAttribute('title', 'Leaderboard.view_scatter_plot');
  });

  it('should highlight active table view', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    const { container } = render(
      <ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />,
    );

    const buttons = container.querySelectorAll('button');
    // First button (table) should have active styles
    expect(buttons[0]?.className).toContain('bg-background');
    // Other buttons should not have active styles
    expect(buttons[1]?.className).not.toContain('bg-background text-foreground shadow-sm');
  });

  it('should highlight active bar view', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    const { container } = render(
      <ViewToggle viewMode="bar" onViewModeChange={mockOnViewModeChange} />,
    );

    const buttons = container.querySelectorAll('button');
    // Second button (bar) should have active styles
    expect(buttons[1]?.className).toContain('bg-background');
  });

  it('should highlight active scatter view', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    const { container } = render(
      <ViewToggle viewMode="scatter" onViewModeChange={mockOnViewModeChange} />,
    );

    const buttons = container.querySelectorAll('button');
    // Third button (scatter) should have active styles
    expect(buttons[2]?.className).toContain('bg-background');
  });

  it('should call onViewModeChange with "table" when table button is clicked', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="bar" onViewModeChange={mockOnViewModeChange} />);

    const tableButton = screen.getByTestId('icon-TableIcon').closest('button');
    if (tableButton) fireEvent.click(tableButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith('table');
  });

  it('should call onViewModeChange with "bar" when bar chart button is clicked', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />);

    const barButton = screen.getByTestId('icon-BarChart3Icon').closest('button');
    if (barButton) fireEvent.click(barButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith('bar');
  });

  it('should call onViewModeChange with "scatter" when scatter button is clicked', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />);

    const scatterButton = screen.getByTestId('icon-ScatterChartIcon').closest('button');
    if (scatterButton) fireEvent.click(scatterButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith('scatter');
  });

  it('should call onViewModeChange even when clicking already active mode', async () => {
    const { ViewToggle } = await import('./ViewToggle');
    render(<ViewToggle viewMode="table" onViewModeChange={mockOnViewModeChange} />);

    const tableButton = screen.getByTestId('icon-TableIcon').closest('button');
    if (tableButton) fireEvent.click(tableButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith('table');
  });
});
