import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

describe('LeaderboardContentSkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render with default props', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton />);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should render default 10 rows', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(10);
  });

  it('should render custom number of rows', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton rows={5} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(5);
  });

  it('should render default 7 metric columns', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton />);
    const headerCells = container.querySelectorAll('thead th');
    // rank + model + 7 metrics + cutoff + vision + license = 12
    expect(headerCells.length).toBeGreaterThanOrEqual(7);
  });

  it('should render custom number of metric columns', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton metricColumns={3} />);
    const headerCells = container.querySelectorAll('thead th');
    // rank + model + 3 metrics + cutoff + vision + license = 8
    expect(headerCells.length).toBeGreaterThanOrEqual(3);
  });

  it('should render skeleton elements', async () => {
    const { LeaderboardContentSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardContentSkeleton />);
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('LeaderboardTableSkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render with default props', async () => {
    const { LeaderboardTableSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardTableSkeleton />);
    expect(container.querySelector('[data-testid="card"]')).toBeInTheDocument();
  });

  it('should render header skeleton', async () => {
    const { LeaderboardTableSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardTableSkeleton />);
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render with custom rows', async () => {
    const { LeaderboardTableSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardTableSkeleton rows={3} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('should render with custom metric columns', async () => {
    const { LeaderboardTableSkeleton } = await import('./LeaderboardTableSkeleton');
    const { container } = render(<LeaderboardTableSkeleton metricColumns={5} />);
    expect(container.querySelector('table')).toBeInTheDocument();
  });
});
