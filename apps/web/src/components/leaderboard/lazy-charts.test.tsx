import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./LeaderboardTableSkeleton', () => ({
  LeaderboardContentSkeleton: ({
    rows,
    metricColumns,
  }: {
    rows: number;
    metricColumns: number;
  }) => (
    <div data-testid="loading-skeleton" data-rows={rows} data-metric-columns={metricColumns}>
      Loading...
    </div>
  ),
}));

vi.mock('./LeaderboardBarChart', () => ({
  LeaderboardBarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

vi.mock('./LeaderboardScatterPlot', () => ({
  LeaderboardScatterPlot: () => <div data-testid="scatter-plot">Scatter Plot</div>,
}));

describe('lazy-charts', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render LazyLeaderboardBarChart', async () => {
    const { LazyLeaderboardBarChart } = await import('./lazy-charts');
    render(
      <LazyLeaderboardBarChart
        models={[]}
        metric={{
          id: 'test',
          field: 'test',
          label: 'Test',
          format: 'percentage',
          higherIsBetter: true,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('should render LazyLeaderboardScatterPlot', async () => {
    const { LazyLeaderboardScatterPlot } = await import('./lazy-charts');
    render(
      <LazyLeaderboardScatterPlot
        models={[]}
        xMetric={{ id: 'x', field: 'x', label: 'X', format: 'percentage', higherIsBetter: true }}
        yMetric={{ id: 'y', field: 'y', label: 'Y', format: 'percentage', higherIsBetter: true }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('scatter-plot')).toBeInTheDocument();
    });
  });

  it('should export LazyLeaderboardBarChart as a component', async () => {
    const { LazyLeaderboardBarChart } = await import('./lazy-charts');
    expect(LazyLeaderboardBarChart).toBeDefined();
  });

  it('should export LazyLeaderboardScatterPlot as a component', async () => {
    const { LazyLeaderboardScatterPlot } = await import('./lazy-charts');
    expect(LazyLeaderboardScatterPlot).toBeDefined();
  });
});
