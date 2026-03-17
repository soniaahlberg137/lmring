import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LeaderboardPage from './page';

const { useLeaderboardDataMock } = vi.hoisted(() => ({
  useLeaderboardDataMock: vi.fn(),
}));

vi.mock('@/hooks/use-leaderboard-query', () => ({
  useLeaderboardData: (...args: unknown[]) => useLeaderboardDataMock(...args),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/libs/zeroeval-api', () => ({
  CATEGORY_CONFIGS: [
    {
      id: 'all',
      label: 'All',
      icon: 'LayoutGrid',
      metrics: [
        { id: 'gpqa', label: 'GPQA', field: 'gpqa_score' },
        { id: 'input_price', label: 'Input', field: 'input_price' },
        { id: 'output_price', label: 'Output', field: 'output_price' },
      ],
    },
    {
      id: 'vision',
      label: 'Vision',
      icon: 'Eye',
      metrics: [
        { id: 'vision_score', label: 'Vision', field: 'vision_score' },
        { id: 'input_price', label: 'Input', field: 'input_price' },
        { id: 'output_price', label: 'Output', field: 'output_price' },
      ],
    },
  ],
  isNewModel: () => false,
  sortAndRankModels: <T,>(models: T[]) => [...models],
  sortModels: <T,>(models: T[]) => [...models],
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron" />,
}));

vi.mock('@/components/leaderboard', () => ({
  CategoryTabs: ({ onCategoryChange }: { onCategoryChange: (id: string) => void }) => (
    <div>
      <button type="button" onClick={() => onCategoryChange('all')}>
        all
      </button>
      <button type="button" onClick={() => onCategoryChange('vision')}>
        vision
      </button>
    </div>
  ),
  createBaseColumns: () => [{ id: 'rank' }],
  createMetricColumns: () => [{ id: 'metric' }],
  createTrailingColumns: () => [{ id: 'trail' }],
  DataTable: ({ data }: { data: unknown[] }) => <div data-testid="data-table">{data.length}</div>,
  LazyLeaderboardBarChart: () => <div data-testid="bar-chart" />,
  LazyLeaderboardScatterPlot: () => <div data-testid="scatter-plot" />,
  LeaderboardContentSkeleton: () => <div data-testid="content-skeleton" />,
  LeaderboardTableSkeleton: () => <div data-testid="table-skeleton" />,
  MetricSelector: ({ selectedMetric, label }: { selectedMetric: string; label?: string }) => (
    <div data-testid="metric-selector">
      {label}:{selectedMetric}
    </div>
  ),
  ViewToggle: ({ onViewModeChange }: { onViewModeChange: (mode: string) => void }) => (
    <div>
      <button type="button" onClick={() => onViewModeChange('table')}>
        table
      </button>
      <button type="button" onClick={() => onViewModeChange('bar')}>
        bar
      </button>
      <button type="button" onClick={() => onViewModeChange('scatter')}>
        scatter
      </button>
    </div>
  ),
}));

describe('LeaderboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders initial loading skeleton', () => {
    useLeaderboardDataMock.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      isInitialLoading: true,
    });

    render(<LeaderboardPage />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useLeaderboardDataMock.mockReturnValue({
      data: null,
      isPending: false,
      error: new Error('boom'),
      isInitialLoading: false,
    });

    render(<LeaderboardPage />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('renders table view with data', () => {
    useLeaderboardDataMock.mockReturnValue({
      data: [
        {
          model_name: 'm1',
          provider: 'openai',
          release_date: '2024-01-01',
          announcement_date: '2024-01-01',
        },
        {
          model_name: 'm2',
          provider: 'openai',
          release_date: '2024-01-02',
          announcement_date: '2024-01-02',
        },
      ],
      isPending: false,
      error: null,
      isInitialLoading: false,
    });

    render(<LeaderboardPage />);

    expect(screen.getByText('Leaderboard.page_title')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toHaveTextContent('2');
  });

  it('switches view modes', () => {
    useLeaderboardDataMock.mockReturnValue({
      data: [
        {
          model_name: 'm1',
          provider: 'openai',
          release_date: '2024-01-01',
          announcement_date: '2024-01-01',
        },
      ],
      isPending: false,
      error: null,
      isInitialLoading: false,
    });

    render(<LeaderboardPage />);

    fireEvent.click(screen.getByText('bar'));
    expect(screen.getByTestId('metric-selector')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    fireEvent.click(screen.getByText('scatter'));
    expect(screen.getAllByTestId('metric-selector').length).toBeGreaterThan(1);
    expect(screen.getByTestId('scatter-plot')).toBeInTheDocument();
  });
});
