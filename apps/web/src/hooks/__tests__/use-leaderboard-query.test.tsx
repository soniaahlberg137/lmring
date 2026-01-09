import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as zeroEvalApi from '@/libs/zeroeval-api';
import { useLeaderboardData, useLeaderboardQuery } from '../use-leaderboard-query';

const mockModelFull = {
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
};

const mockModelBasic = {
  model_id: 'basic-model',
  name: 'Basic Model',
  model_type: 'video' as const,
  organization: 'Basic Org',
  organization_id: 'basic-org',
  announcement_date: '2025-01-01',
  release_date: '2025-01-01',
  multimodal: false,
  license: 'Apache-2.0',
  is_open: true,
  input_modalities: ['text'],
  output_modalities: ['video'],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLeaderboardQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches leaderboard data for "all" category', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    const firstModel = result.current.data?.[0];
    expect(firstModel?.model_id).toBe('test-model');
  });

  it('fetches leaderboard data for "vision" category with multimodal models', async () => {
    const visionModel = { ...mockModelFull, multimodal: true };
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([visionModel]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardQuery('vision'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    const firstModel = result.current.data?.[0];
    expect(firstModel?.multimodal).toBe(true);
    // getModelsFull should be called with true for vision
    expect(zeroEvalApi.getModelsFull).toHaveBeenCalledWith(true);
  });

  it('handles arena score fetch failure gracefully', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockRejectedValue(new Error('Arena API error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should still return data even when arena scores fail
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    // Arena scores should be null
    const firstModel = result.current.data?.[0];
    expect(firstModel?.arena_raw_scores).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('Failed to fetch arena scores, continuing without them');

    warnSpy.mockRestore();
  });

  it('returns empty array when API returns empty data', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles API error correctly', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('API Error');
  });

  it('fetches other categories using getModelsAll', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsAll').mockResolvedValue([mockModelBasic]);
    vi.spyOn(zeroEvalApi, 'getArenaScoresForCategory').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardQuery('video-generation'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(zeroEvalApi.getModelsAll).toHaveBeenCalled();
    expect(zeroEvalApi.getArenaScoresForCategory).toHaveBeenCalled();
  });
});

describe('useLeaderboardData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides derived loading states', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardData('all'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isInitialLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After loading
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isRefetching).toBe(false);
  });
});
