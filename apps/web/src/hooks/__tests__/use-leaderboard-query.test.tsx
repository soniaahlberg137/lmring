import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useLeaderboardQuery } from '../use-leaderboard-query';

vi.mock('@/libs/zeroeval-api', async () => {
  const actual = await vi.importActual('@/libs/zeroeval-api');
  return {
    ...actual,
    getModelsFull: vi.fn().mockResolvedValue([
      {
        model_id: 'test-model',
        name: 'Test Model',
        organization: 'Test Org',
        organization_id: 'test-org',
        organization_country: 'US',
        params: 7000000000,
        context: 128000,
        canonical_model_id: null,
        announcement_date: '2025-01-01',
        release_date: '2025-01-01',
        multimodal: false,
        license: 'MIT',
        knowledge_cutoff: '2024-12-01',
        input_price: '0.50',
        output_price: '1.50',
        throughput: null,
        latency: null,
        aime_2025_score: 0.85,
        hle_score: null,
        gpqa_score: 0.75,
        swe_bench_verified_score: 0.65,
        mmmu_score: 0.7,
      },
    ]),
    getArenaScores: vi.fn().mockResolvedValue({}),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLeaderboardQuery', () => {
  it('fetches leaderboard data for "all" category', async () => {
    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
