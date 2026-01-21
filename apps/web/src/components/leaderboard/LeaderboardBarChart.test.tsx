import { cleanup, render, screen } from '@testing-library/react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      shortName: string;
      value: number;
      color: string;
      organization: string;
      modelId: string;
      arenaRawScores?: Record<string, number> | null;
    };
  }>;
}

let capturedTooltipContent: React.ComponentType<TooltipContentProps> | null = null;
let capturedXAxisProps: { tickFormatter?: (v: number) => string } | null = null;

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: (props: { tickFormatter?: (v: number) => string }) => {
    capturedXAxisProps = props;
    return <div data-testid="x-axis" />;
  },
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: { content: React.ReactElement<TooltipContentProps> }) => {
    if (content && typeof content.type !== 'string') {
      capturedTooltipContent = content.type as React.ComponentType<TooltipContentProps>;
    }
    return <div data-testid="tooltip" />;
  },
  Cell: () => <div data-testid="cell" />,
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
    knowledge_cutoff: '2024-01',
  },
];

const mockMetric = {
  id: 'gpqa',
  field: 'gpqa_score',
  label: 'GPQA',
  format: 'percentage' as const,
  higherIsBetter: true,
};

describe('LeaderboardBarChart', () => {
  afterEach(() => {
    cleanup();
    capturedTooltipContent = null;
    capturedXAxisProps = null;
  });

  it('should render chart with data', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render empty state when no data', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    render(<LeaderboardBarChart models={[]} metric={mockMetric} />);
    expect(screen.getByText('No data available for this metric')).toBeInTheDocument();
  });

  it('should filter models with null values', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const modelsWithNull = [
      ...mockModels,
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...mockModels[0]!,
        model_id: 'model-3',
        name: 'Model 3',
        gpqa_score: null,
      },
    ] as typeof mockModels;
    render(<LeaderboardBarChart models={modelsWithNull} metric={mockMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should limit to maxItems', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const manyModels = Array.from({ length: 20 }, (_, i) => ({
      // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
      ...mockModels[0]!,
      model_id: `model-${i}`,
      name: `Model ${i}`,
      gpqa_score: 0.8 - i * 0.01,
    }));
    render(<LeaderboardBarChart models={manyModels} metric={mockMetric} maxItems={5} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should use default maxItems of 15', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render with currency format', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const currencyMetric = {
      ...mockMetric,
      id: 'input_price',
      field: 'input_price',
      format: 'currency' as const,
    };
    const modelsWithPrice = mockModels.map((m) => ({ ...m, input_price: '0.01' }));
    render(<LeaderboardBarChart models={modelsWithPrice} metric={currencyMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render with context format', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const contextMetric = {
      ...mockMetric,
      id: 'context',
      field: 'context',
      format: 'context' as const,
    };
    const modelsWithContext = mockModels.map((m) => ({ ...m, context: 128000 }));
    render(<LeaderboardBarChart models={modelsWithContext} metric={contextMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render with negative arena scores', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const arenaMetric = {
      ...mockMetric,
      id: 'code_arena',
      field: 'code_arena_score',
      format: 'number' as const,
    };
    const modelsWithArena = mockModels.map((m, i) => ({
      ...m,
      code_arena_score: i === 0 ? 150 : -50,
    }));
    render(<LeaderboardBarChart models={modelsWithArena} metric={arenaMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should truncate long model names with ellipsis', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const longNameModel = {
      // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
      ...mockModels[0]!,
      model_id: 'long-name-model',
      name: 'Very Long Model Name That Exceeds Maximum',
    };
    render(<LeaderboardBarChart models={[longNameModel]} metric={mockMetric} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render chart with arena metric including raw scores', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const arenaMetric = {
      ...mockMetric,
      id: 'code_arena',
      field: 'code_arena_score',
      format: 'number' as const,
    };
    const modelsWithArenaScores = [
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...mockModels[0]!,
        code_arena_score: 1250,
        arena_raw_scores: {
          'text-to-website': 0.85,
          threejs: 0.72,
          'text-to-game': 0.68,
        },
      },
    ];
    render(
      <LeaderboardBarChart
        models={modelsWithArenaScores as typeof mockModels}
        metric={arenaMetric}
      />,
    );
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should handle chat arena metric', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    const chatArenaMetric = {
      ...mockMetric,
      id: 'chat_arena',
      field: 'chat_arena_score',
      format: 'number' as const,
    };
    const modelsWithChatArena = [
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...mockModels[0]!,
        chat_arena_score: 1180,
        arena_raw_scores: {
          'chat-arena': 11.8,
        },
      },
    ];
    render(
      <LeaderboardBarChart
        models={modelsWithChatArena as typeof mockModels}
        metric={chatArenaMetric}
      />,
    );
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

describe('CustomTooltip', () => {
  afterEach(() => {
    cleanup();
  });

  it('should return null when active=false', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    capturedTooltipContent = null;
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} key="test-1" />);

    expect(capturedTooltipContent).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: Already checked above
    const TooltipContent = capturedTooltipContent!;
    const { container } = render(<TooltipContent active={false} payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when payload is empty', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    capturedTooltipContent = null;
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} key="test-2" />);

    expect(capturedTooltipContent).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: Already checked above
    const TooltipContent = capturedTooltipContent!;
    const { container } = render(<TooltipContent active={true} payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render model name, organization, and formatted value', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    capturedTooltipContent = null;
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} key="test-3" />);

    expect(capturedTooltipContent).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: Already checked above
    const TooltipContent = capturedTooltipContent!;
    const payload = [
      {
        payload: {
          name: 'GPT-4',
          shortName: 'GPT-4',
          value: 0.85,
          color: '#5BB8CC',
          organization: 'OpenAI',
          modelId: 'model-1',
          arenaRawScores: null,
        },
      },
    ];
    render(<TooltipContent active={true} payload={payload} />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('should render metric label', async () => {
    expect(capturedTooltipContent).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: Already checked above
    const TooltipContent = capturedTooltipContent!;
    const payload = [
      {
        payload: {
          name: 'Claude-3',
          shortName: 'Claude',
          value: 0.92,
          color: '#FF6B6B',
          organization: 'Anthropic',
          modelId: 'model-2',
          arenaRawScores: null,
        },
      },
    ];
    render(<TooltipContent active={true} payload={payload} />);
    expect(screen.getByText('Claude-3')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('GPQA')).toBeInTheDocument();
  });
});

describe('XAxis tickFormatter', () => {
  afterEach(() => {
    cleanup();
    capturedTooltipContent = null;
    capturedXAxisProps = null;
  });

  it('should format percentage values correctly', async () => {
    const { LeaderboardBarChart } = await import('./LeaderboardBarChart');
    render(<LeaderboardBarChart models={mockModels} metric={mockMetric} />);

    expect(capturedXAxisProps).not.toBeNull();
    expect(capturedXAxisProps?.tickFormatter).toBeDefined();
    expect(capturedXAxisProps?.tickFormatter?.(0.5)).toBe('50%');
    expect(capturedXAxisProps?.tickFormatter?.(0.85)).toBe('85%');
  });
});
