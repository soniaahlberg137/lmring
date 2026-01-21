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
  CheckIcon: createMockIcon('CheckIcon'),
  ChevronDownIcon: createMockIcon('ChevronDownIcon'),
  ChevronUpIcon: createMockIcon('ChevronUpIcon'),
  LockIcon: createMockIcon('LockIcon'),
  UnlockIcon: createMockIcon('UnlockIcon'),
  XIcon: createMockIcon('XIcon'),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <div data-testid={`provider-icon-${providerId}`} />
  ),
}));

vi.mock('@/libs/zeroeval-api', () => ({
  formatMetricValue: (value: number | string | null, format: string) => {
    if (value === null) return '—';
    if (format === 'percentage') return `${(Number(value) * 100).toFixed(1)}%`;
    return String(value);
  },
}));

describe('LeaderboardTable', () => {
  const mockOnSort = vi.fn();
  const mockOnPageChange = vi.fn();

  const defaultMetrics = [
    {
      id: 'gpqa',
      label: 'GPQA',
      field: 'gpqa_score',
      format: 'percentage' as const,
      higherIsBetter: true,
    },
    {
      id: 'mmlu',
      label: 'MMLU',
      field: 'mmlu_score',
      format: 'percentage' as const,
      higherIsBetter: true,
    },
  ];

  const defaultModels = [
    {
      model_id: 'gpt-4',
      name: 'GPT-4',
      organization: 'OpenAI',
      organization_id: 'openai',
      rank: 1,
      gpqa_score: 0.85,
      mmlu_score: 0.92,
      knowledge_cutoff: '2024-01',
      multimodal: true,
      license: 'proprietary',
      isNew: true,
      release_date: null,
      announcement_date: '2024-01-01',
    },
    {
      model_id: 'claude-3',
      name: 'Claude 3',
      organization: 'Anthropic',
      organization_id: 'anthropic',
      rank: 2,
      gpqa_score: 0.82,
      mmlu_score: 0.9,
      knowledge_cutoff: '2024-02',
      multimodal: true,
      license: 'proprietary',
      isNew: false,
      release_date: null,
      announcement_date: '2024-02-01',
    },
    {
      model_id: 'llama-3',
      name: 'Llama 3',
      organization: 'Meta',
      organization_id: 'meta',
      rank: 3,
      gpqa_score: 0.75,
      mmlu_score: 0.85,
      knowledge_cutoff: '2023-12',
      multimodal: false,
      license: 'MIT',
      isNew: false,
      release_date: null,
      announcement_date: '2023-12-01',
    },
  ];

  const defaultProps = {
    models: defaultModels,
    metrics: defaultMetrics,
    sortConfig: { field: 'gpqa_score', direction: 'desc' as const },
    onSort: mockOnSort,
    page: 1,
    pageSize: 10,
    totalCount: 3,
    onPageChange: mockOnPageChange,
  };

  beforeEach(() => {
    mockOnSort.mockClear();
    mockOnPageChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render table headers', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('Leaderboard.table_rank')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard.table_model')).toBeInTheDocument();
    expect(screen.getByText('GPQA')).toBeInTheDocument();
    expect(screen.getByText('MMLU')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard.table_knowledge_cutoff')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard.table_multimodal')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard.table_license')).toBeInTheDocument();
  });

  it('should render model names', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3')).toBeInTheDocument();
    expect(screen.getByText('Llama 3')).toBeInTheDocument();
  });

  it('should render organization names', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
  });

  it('should render provider icons', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByTestId('provider-icon-openai')).toBeInTheDocument();
    expect(screen.getByTestId('provider-icon-anthropic')).toBeInTheDocument();
    expect(screen.getByTestId('provider-icon-meta')).toBeInTheDocument();
  });

  it('should render NEW badge for new models', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('Leaderboard.table_new')).toBeInTheDocument();
  });

  it('should render rank badges with correct styling', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(<LeaderboardTable {...defaultProps} />);

    // Rank 1 should have gold styling
    const rank1 = container.querySelector('.bg-yellow-500');
    expect(rank1).toBeInTheDocument();
    expect(rank1?.textContent).toBe('1');

    // Rank 2 should have silver styling
    const rank2 = container.querySelector('.bg-gray-400');
    expect(rank2).toBeInTheDocument();
    expect(rank2?.textContent).toBe('2');

    // Rank 3 should have bronze styling
    const rank3 = container.querySelector('.bg-amber-600');
    expect(rank3).toBeInTheDocument();
    expect(rank3?.textContent).toBe('3');
  });

  it('should render multimodal icons', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    // GPT-4 and Claude 3 have multimodal=true (CheckIcon)
    const checkIcons = screen.getAllByTestId('icon-CheckIcon');
    expect(checkIcons.length).toBe(2);

    // Llama 3 has multimodal=false (XIcon)
    const xIcons = screen.getAllByTestId('icon-XIcon');
    expect(xIcons.length).toBe(1);
  });

  it('should render license badges', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    // Proprietary licenses show LockIcon
    const lockIcons = screen.getAllByTestId('icon-LockIcon');
    expect(lockIcons.length).toBe(2);

    // Open license (MIT) shows UnlockIcon
    expect(screen.getByTestId('icon-UnlockIcon')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('should call onSort when clicking sortable column header', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    fireEvent.click(screen.getByText('GPQA'));

    expect(mockOnSort).toHaveBeenCalledWith('gpqa_score');
  });

  it('should show sort indicator for sorted column', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    // Sorted descending should show ChevronDownIcon
    expect(screen.getByTestId('icon-ChevronDownIcon')).toBeInTheDocument();
  });

  it('should show ascending indicator when sorted ascending', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(
      <LeaderboardTable {...defaultProps} sortConfig={{ field: 'gpqa_score', direction: 'asc' }} />,
    );

    expect(screen.getByTestId('icon-ChevronUpIcon')).toBeInTheDocument();
  });

  it('should render pagination info', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(<LeaderboardTable {...defaultProps} />);

    // Pagination text is in a single element: "1-3 Leaderboard.pagination_of 3"
    const paginationSection = container.querySelector('.flex.items-center.justify-between');
    expect(paginationSection?.textContent).toContain('1-3');
    expect(paginationSection?.textContent).toContain('Leaderboard.pagination_of');
  });

  it('should render pagination buttons', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('Leaderboard.pagination_previous')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard.pagination_next')).toBeInTheDocument();
  });

  it('should call onPageChange when clicking next page', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} totalCount={25} />);

    fireEvent.click(screen.getByText('Leaderboard.pagination_next'));

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable previous button on first page', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    const prevButton = screen.getByText('Leaderboard.pagination_previous');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} totalCount={3} />);

    const nextButton = screen.getByText('Leaderboard.pagination_next');
    expect(nextButton).toBeDisabled();
  });

  it('should render knowledge cutoff dates', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(<LeaderboardTable {...defaultProps} />);

    expect(screen.getByText('2024-01')).toBeInTheDocument();
    expect(screen.getByText('2024-02')).toBeInTheDocument();
    expect(screen.getByText('2023-12')).toBeInTheDocument();
  });

  it('should display dash for empty knowledge cutoff', async () => {
    const modelsWithEmptyCutoff = [
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...defaultModels[0]!,
        knowledge_cutoff: null,
      },
    ];
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(
      <LeaderboardTable
        {...defaultProps}
        models={modelsWithEmptyCutoff as unknown as typeof defaultModels}
        totalCount={1}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should call onPageChange when clicking page number button', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(
      <LeaderboardTable {...defaultProps} totalCount={50} pageSize={10} />,
    );

    const pageButtons = container.querySelectorAll('button.w-8.h-8');
    const pageButton2 = Array.from(pageButtons).find((btn) => btn.textContent === '2');
    expect(pageButton2).toBeInTheDocument();
    if (pageButton2) fireEvent.click(pageButton2);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should highlight current page button', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(
      <LeaderboardTable {...defaultProps} totalCount={50} pageSize={10} page={2} />,
    );

    const pageButtons = container.querySelectorAll('button.w-8.h-8');
    const currentPageButton = Array.from(pageButtons).find((btn) => btn.textContent === '2');
    expect(currentPageButton).toHaveClass('bg-primary');
  });

  it('should render rank 4+ with muted text style', async () => {
    const modelsWithRank4 = [
      ...defaultModels,
      {
        model_id: 'gemini',
        name: 'Gemini',
        organization: 'Google',
        organization_id: 'google',
        rank: 4,
        gpqa_score: 0.7,
        mmlu_score: 0.8,
        knowledge_cutoff: '2024-01',
        multimodal: true,
        license: 'proprietary',
        isNew: false,
        release_date: null,
        announcement_date: '2024-01-01',
      },
    ];
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(
      <LeaderboardTable {...defaultProps} models={modelsWithRank4} totalCount={4} />,
    );

    const rank4Element = container.querySelector('span.text-muted-foreground.font-medium.text-xs');
    expect(rank4Element).toBeInTheDocument();
    expect(rank4Element?.textContent).toBe('4');
  });

  it('should render resize handles for columns', async () => {
    const { LeaderboardTable } = await import('./LeaderboardTable');
    const { container } = render(<LeaderboardTable {...defaultProps} />);

    const resizeHandles = container.querySelectorAll('[role="slider"]');
    expect(resizeHandles.length).toBeGreaterThan(0);
  });

  it('should render ArenaScoreCell for arena metrics', async () => {
    const arenaMetrics = [
      {
        id: 'code_arena',
        label: 'Code Arena',
        field: 'code_arena_score',
        format: 'number' as const,
        higherIsBetter: true,
      },
    ];
    const modelsWithArena = [
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...defaultModels[0]!,
        code_arena_score: 1250,
        arena_raw_scores: {
          'text-to-website': 0.85,
          threejs: 0.72,
        },
      },
    ];
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(
      <LeaderboardTable
        {...defaultProps}
        models={modelsWithArena as typeof defaultModels}
        metrics={arenaMetrics}
        totalCount={1}
      />,
    );

    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('should truncate long license names', async () => {
    const modelsWithLongLicense = [
      {
        // biome-ignore lint/style/noNonNullAssertion: Test knows array has elements
        ...defaultModels[0]!,
        license: 'Apache-2.0-with-LLVM-exception',
      },
    ];
    const { LeaderboardTable } = await import('./LeaderboardTable');
    render(
      <LeaderboardTable
        {...defaultProps}
        models={modelsWithLongLicense as typeof defaultModels}
        totalCount={1}
      />,
    );

    expect(screen.getByText('Apache-2.0-w...')).toBeInTheDocument();
  });
});
