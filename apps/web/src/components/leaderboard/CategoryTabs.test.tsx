import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LeaderboardCategory } from '@/libs/zeroeval-api';

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
  Eye: createMockIcon('Eye'),
  Image: createMockIcon('Image'),
  LayoutGrid: createMockIcon('LayoutGrid'),
  MessageSquare: createMockIcon('MessageSquare'),
  Mic: createMockIcon('Mic'),
  Video: createMockIcon('Video'),
  Volume2: createMockIcon('Volume2'),
}));

const mockPrefetchQuery = vi.fn();
const mockGetQueryData = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    prefetchQuery: mockPrefetchQuery,
    getQueryData: mockGetQueryData,
  }),
}));

vi.mock('@/hooks/use-leaderboard-query', () => ({
  fetchLeaderboardData: vi.fn(),
  leaderboardKeys: {
    category: (id: string) => ['leaderboard', id],
  },
}));

vi.mock('@/libs/zeroeval-api', () => ({
  CATEGORY_CONFIGS: [
    { id: 'all', label: 'All', icon: 'LayoutGrid' },
    { id: 'text', label: 'Text', icon: 'MessageSquare' },
    { id: 'vision', label: 'Vision', icon: 'Eye' },
  ],
}));

describe('CategoryTabs', () => {
  const mockOnCategoryChange = vi.fn();

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
    mockPrefetchQuery.mockClear();
    mockGetQueryData.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render all category tabs', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });

  it('should render icons for each category', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    expect(screen.getByTestId('icon-LayoutGrid')).toBeInTheDocument();
    expect(screen.getByTestId('icon-MessageSquare')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Eye')).toBeInTheDocument();
  });

  it('should call onCategoryChange when tab is clicked', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    fireEvent.click(screen.getByText('Text'));

    expect(mockOnCategoryChange).toHaveBeenCalledWith('text');
  });

  it('should highlight active category', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    const { container } = render(
      <CategoryTabs
        activeCategory={'text' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    const textButton = container.querySelector('[data-category="text"]');
    expect(textButton?.className).toContain('text-foreground');
  });

  it('should dim inactive categories', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    const { container } = render(
      <CategoryTabs
        activeCategory={'text' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    const allButton = container.querySelector('[data-category="all"]');
    expect(allButton?.className).toContain('text-muted-foreground');
  });

  it('should prefetch data on mouse enter when no cached data', async () => {
    mockGetQueryData.mockReturnValue(undefined);

    const { CategoryTabs } = await import('./CategoryTabs');
    render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    fireEvent.mouseEnter(screen.getByText('Vision'));

    expect(mockPrefetchQuery).toHaveBeenCalled();
  });

  it('should not prefetch data on mouse enter when data is cached', async () => {
    mockGetQueryData.mockReturnValue({ data: [] });

    const { CategoryTabs } = await import('./CategoryTabs');
    render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    fireEvent.mouseEnter(screen.getByText('Vision'));

    expect(mockPrefetchQuery).not.toHaveBeenCalled();
  });

  it('should render data-category attributes', async () => {
    const { CategoryTabs } = await import('./CategoryTabs');
    const { container } = render(
      <CategoryTabs
        activeCategory={'all' as LeaderboardCategory}
        onCategoryChange={mockOnCategoryChange}
      />,
    );

    expect(container.querySelector('[data-category="all"]')).toBeInTheDocument();
    expect(container.querySelector('[data-category="text"]')).toBeInTheDocument();
    expect(container.querySelector('[data-category="vision"]')).toBeInTheDocument();
  });
});
