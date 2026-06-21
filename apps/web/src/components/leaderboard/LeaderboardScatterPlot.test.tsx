import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter-chart">{children}</div>
  ),
  Scatter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter">{children}</div>
  ),
  XAxis: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="x-axis">{children}</div>
  ),
  YAxis: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="y-axis">{children}</div>
  ),
  ZAxis: () => <div data-testid="z-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
  Label: ({ value }: { value?: string }) => <div data-testid="label">{value}</div>,
  LabelList: () => <div data-testid="label-list" />,
}));

vi.mock('@/libs/zeroeval-api', () => ({
  formatMetricValue: (value: number | null, format: string) => {
    if (value === null) return '—';
    if (format === 'percentage') return `${(value * 100).toFixed(1)}%`;
    if (format === 'currency') return `$${value.toFixed(2)}`;
    if (format === 'context') return `${value}K`;
    return String(value);
  },
  getNumericValue: (value: string | number | null) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  },
}));

const mockModels = [
  {
    model_id: 'model-1',
    name: 'GPT-4',
    organization: 'OpenAI',
    organization_id: 'openai',
    release_date: null,
    announcement_date: '2024-01-01',
    multimodal: true,
    license: 'proprietary',
    rank: 1,
    isNew: false,
    gpqa_score: 0.85,
    hle_score: 0.9,
    knowledge_cutoff: '2024-01',
  },
  {
    model_id: 'model-2',
    name: 'Claude 3',
    organization: 'Anthropic',
    organization_id: 'anthropic',
    release_date: null,
    announcement_date: '2024-01-01',
    multimodal: true,
    license: 'proprietary',
    rank: 2,
    isNew: false,
    gpqa_score: 0.82,
    hle_score: 0.88,
    knowledge_cutoff: '2024-01',
  },
];

const xMetric = {
  id: 'gpqa',
  field: 'gpqa_score',
  label: 'GPQA',
  format: 'percentage' as const,
  higherIsBetter: true,
};

const yMetric = {
  id: 'hle',
  field: 'hle_score',
  label: 'HLE',
  format: 'percentage' as const,
  higherIsBetter: true,
};

describe('LeaderboardScatterPlot', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render chart with data', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    render(<LeaderboardScatterPlot models={mockModels} xMetric={xMetric} yMetric={yMetric} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('should render empty state when no data', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    render(<LeaderboardScatterPlot models={[]} xMetric={xMetric} yMetric={yMetric} />);
    expect(screen.getByText('No data available for these metrics')).toBeInTheDocument();
  });

  it('should filter models with missing x values', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    const modelsWithNull = [
      ...mockModels,
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...mockModels[0]!,
        model_id: 'model-3',
        name: 'Model 3',
        gpqa_score: null,
        hle_score: 0.85,
      },
    ] as typeof mockModels;
    render(<LeaderboardScatterPlot models={modelsWithNull} xMetric={xMetric} yMetric={yMetric} />);
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('should filter models with missing y values', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    const modelsWithNull = [
      ...mockModels,
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...mockModels[0]!,
        model_id: 'model-3',
        name: 'Model 3',
        gpqa_score: 0.8,
        hle_score: null,
      },
    ] as typeof mockModels;
    render(<LeaderboardScatterPlot models={modelsWithNull} xMetric={xMetric} yMetric={yMetric} />);
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('should render with different metric formats', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    const currencyXMetric = {
      ...xMetric,
      id: 'input_price',
      field: 'input_price',
      format: 'currency' as const,
    };
    const contextYMetric = {
      ...yMetric,
      id: 'context',
      field: 'context',
      format: 'context' as const,
    };
    const modelsWithValues = mockModels.map((m) => ({
      ...m,
      input_price: '0.01',
      context: 128000,
    }));
    render(
      <LeaderboardScatterPlot
        models={modelsWithValues}
        xMetric={currencyXMetric}
        yMetric={contextYMetric}
      />,
    );
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('should render axis labels', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    render(<LeaderboardScatterPlot models={mockModels} xMetric={xMetric} yMetric={yMetric} />);
    const labels = screen.getAllByTestId('label');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('should not render a frontier overlay by default', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    render(<LeaderboardScatterPlot models={mockModels} xMetric={xMetric} yMetric={yMetric} />);
    // Only the main data scatter is rendered.
    expect(screen.getAllByTestId('scatter')).toHaveLength(1);
  });

  it('should render a frontier overlay when showFrontier is set', async () => {
    const { LeaderboardScatterPlot } = await import('./LeaderboardScatterPlot');
    render(
      <LeaderboardScatterPlot
        models={mockModels}
        xMetric={xMetric}
        yMetric={yMetric}
        showFrontier
      />,
    );
    // Main data scatter + Pareto frontier scatter.
    expect(screen.getAllByTestId('scatter')).toHaveLength(2);
  });
});
