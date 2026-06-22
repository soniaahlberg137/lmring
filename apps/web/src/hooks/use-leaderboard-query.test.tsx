import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as zeroEvalApi from '@/libs/zeroeval-api';
import {
  fetchLeaderboardData,
  leaderboardKeys,
  useLeaderboardData,
  useLeaderboardQuery,
  usePrefetchLeaderboard,
} from './use-leaderboard-query';

const mockModelFull: zeroEvalApi.ZeroEvalModelFull = {
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
  gaia_score: null,
  tau_bench_score: null,
  core_bench_score: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('leaderboardKeys', () => {
  it('returns correct all key', () => {
    expect(leaderboardKeys.all).toEqual(['leaderboard']);
  });

  it('returns correct category key', () => {
    expect(leaderboardKeys.category('all')).toEqual(['leaderboard', 'all']);
    expect(leaderboardKeys.category('vision')).toEqual(['leaderboard', 'vision']);
    expect(leaderboardKeys.category('image-generation')).toEqual([
      'leaderboard',
      'image-generation',
    ]);
  });
});

describe('fetchLeaderboardData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches "all" category data with arena scores', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({
      'test-model': {
        'chat-arena': 0.85,
        'text-to-website': 0.9,
        threejs: 0.8,
        'text-to-game': 0.75,
        'p5-animation': 0.7,
        'text-to-svg': 0.85,
        dataviz: 0.8,
        tonejs: 0.65,
      },
    });

    const result = await fetchLeaderboardData('all');

    expect(zeroEvalApi.getModelsFull).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(1);
    expect(result[0]?.model_id).toBe('test-model');
    expect(result[0]?.chat_arena_score).toBeDefined();
    expect(result[0]?.code_arena_score).toBeDefined();
    expect(result[0]?.arena_raw_scores).toBeDefined();
  });

  it('fetches "vision" category with multimodal parameter', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([
      { ...mockModelFull, multimodal: true },
    ]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const result = await fetchLeaderboardData('vision');

    expect(zeroEvalApi.getModelsFull).toHaveBeenCalledWith(true);
    expect(result).toHaveLength(1);
    expect(result[0]?.multimodal).toBe(true);
  });

  it('fetches other categories using getMagiaLeaderboard', async () => {
    vi.spyOn(zeroEvalApi, 'getMagiaLeaderboard').mockResolvedValue({
      leaderboard: [
        {
          variant_id: 'v1',
          variant_key: 'k1',
          model_id: 'basic-model',
          model_name: 'Basic Model',
          organization: 'Basic Org',
          mu: 25.0,
          sigma: 2.0,
          conservative_rating: 21.0,
          matches_played: 50,
          wins: 30,
          win_rate: 60.0,
          input_price: null,
          output_price: null,
          avg_generation_price: null,
          announcement_date: '2025-01-01',
          license: 'Apache-2.0',
          is_open_source: true,
        },
      ],
      total_count: 1,
      limit: 200,
      offset: 0,
    });

    const result = await fetchLeaderboardData('video-generation');

    expect(zeroEvalApi.getMagiaLeaderboard).toHaveBeenCalledTimes(3);
    expect(zeroEvalApi.getMagiaLeaderboard).toHaveBeenCalledWith('text-to-video');
    expect(zeroEvalApi.getMagiaLeaderboard).toHaveBeenCalledWith('image-to-video');
    expect(zeroEvalApi.getMagiaLeaderboard).toHaveBeenCalledWith('video-editing');
    expect(result).toHaveLength(1);
    expect(result[0]?.model_id).toBe('basic-model');
  });

  it('handles arena score failure gracefully for "all" category', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockRejectedValue(new Error('Arena API error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchLeaderboardData('all');

    expect(result).toHaveLength(1);
    expect(result[0]?.arena_raw_scores).toBeNull();
    expect(result[0]?.code_arena_score).toBeNull();
    expect(result[0]?.chat_arena_score).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('Failed to fetch arena scores, continuing without them');

    warnSpy.mockRestore();
  });

  it('handles magia leaderboard failure gracefully for other categories', async () => {
    vi.spyOn(zeroEvalApi, 'getMagiaLeaderboard').mockRejectedValue(new Error('Magia API error'));

    await expect(fetchLeaderboardData('video-generation')).rejects.toThrow();
  });

  it('returns empty array when no models', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const result = await fetchLeaderboardData('all');

    expect(result).toEqual([]);
  });

  it('handles models without matching arena scores', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({
      'other-model': { 'chat-arena': 0.9 },
    });

    const result = await fetchLeaderboardData('all');

    expect(result[0]?.arena_raw_scores).toBeNull();
    expect(result[0]?.code_arena_score).toBeNull();
    expect(result[0]?.chat_arena_score).toBeNull();
  });
});

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
    expect(result.current.data?.[0]?.model_id).toBe('test-model');
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
    expect(result.current.data?.[0]?.multimodal).toBe(true);
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

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0]?.arena_raw_scores).toBeNull();
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

  it('fetches other categories using getMagiaLeaderboard hook', async () => {
    vi.spyOn(zeroEvalApi, 'getMagiaLeaderboard').mockResolvedValue({
      leaderboard: [
        {
          variant_id: 'v1',
          variant_key: 'k1',
          model_id: 'basic-model',
          model_name: 'Basic Model',
          organization: 'Basic Org',
          mu: 25.0,
          sigma: 2.0,
          conservative_rating: 21.0,
          matches_played: 50,
          wins: 30,
          win_rate: 60.0,
          input_price: null,
          output_price: null,
          avg_generation_price: null,
          announcement_date: '2025-01-01',
          license: 'Apache-2.0',
          is_open_source: true,
        },
      ],
      total_count: 1,
      limit: 200,
      offset: 0,
    });

    const { result } = renderHook(() => useLeaderboardQuery('video-generation'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(zeroEvalApi.getMagiaLeaderboard).toHaveBeenCalled();
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

    expect(result.current.isInitialLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isRefetching).toBe(false);
  });

  it('returns data after successful fetch', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const { result } = renderHook(() => useLeaderboardData('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
  });
});

describe('usePrefetchLeaderboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefetches leaderboard data for a category', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchLeaderboard(), { wrapper });

    // Prefetch should return a function
    expect(typeof result.current.prefetchLeaderboard).toBe('function');

    // Call prefetch
    await result.current.prefetchLeaderboard('all');

    // Check that data is now in cache
    const cachedData = queryClient.getQueryData(['leaderboard', 'all']);
    expect(cachedData).toBeDefined();
    expect(Array.isArray(cachedData)).toBe(true);
  });

  it('uses default category "all" when no category is provided', async () => {
    vi.spyOn(zeroEvalApi, 'getModelsFull').mockResolvedValue([mockModelFull]);
    vi.spyOn(zeroEvalApi, 'getArenaScores').mockResolvedValue({});

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchLeaderboard(), { wrapper });

    // Call prefetch without category (should default to 'all')
    await result.current.prefetchLeaderboard();

    // Check that data is cached under 'all' key
    const cachedData = queryClient.getQueryData(['leaderboard', 'all']);
    expect(cachedData).toBeDefined();
  });
});
