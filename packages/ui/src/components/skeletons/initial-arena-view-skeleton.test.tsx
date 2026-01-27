import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>
      Skeleton
    </div>
  ),
}));

describe('InitialArenaViewSkeleton', () => {
  it('should render skeleton structure', async () => {
    const { InitialArenaViewSkeleton } = await import('./initial-arena-view-skeleton');

    const { container } = render(<InitialArenaViewSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should contain correct number of provider icon skeletons (14)', async () => {
    const { InitialArenaViewSkeleton } = await import('./initial-arena-view-skeleton');

    render(<InitialArenaViewSkeleton />);

    const skeletons = screen.getAllByTestId('skeleton');
    const providerIconSkeletons = skeletons.filter((skeleton) =>
      skeleton.className?.includes('h-[22px] w-[22px]')
    );

    expect(providerIconSkeletons).toHaveLength(14);
  });

  it('should contain hero section skeleton', async () => {
    const { InitialArenaViewSkeleton } = await import('./initial-arena-view-skeleton');

    render(<InitialArenaViewSkeleton />);

    const skeletons = screen.getAllByTestId('skeleton');
    const titleSkeleton = skeletons.find((skeleton) => skeleton.className?.includes('h-8 w-48'));
    const subtitleSkeleton = skeletons.find((skeleton) =>
      skeleton.className?.includes('h-4 w-[420px]')
    );

    expect(titleSkeleton).toBeInTheDocument();
    expect(subtitleSkeleton).toBeInTheDocument();
  });

  it('should contain prompt input skeleton', async () => {
    const { InitialArenaViewSkeleton } = await import('./initial-arena-view-skeleton');

    render(<InitialArenaViewSkeleton />);

    const skeletons = screen.getAllByTestId('skeleton');
    const textareaSkeleton = skeletons.find((skeleton) =>
      skeleton.className?.includes('h-24 rounded-lg')
    );
    const submitSkeleton = skeletons.find((skeleton) =>
      skeleton.className?.includes('h-9 w-9 rounded-lg')
    );

    expect(textareaSkeleton).toBeInTheDocument();
    expect(submitSkeleton).toBeInTheDocument();
  });

  it('should contain model tab bar skeleton', async () => {
    const { InitialArenaViewSkeleton } = await import('./initial-arena-view-skeleton');

    render(<InitialArenaViewSkeleton />);

    const skeletons = screen.getAllByTestId('skeleton');
    const tabSkeletons = skeletons.filter((skeleton) =>
      skeleton.className?.includes('h-10 w-32 rounded-lg')
    );

    expect(tabSkeletons).toHaveLength(2);
  });
});
