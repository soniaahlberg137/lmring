import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ZeroEvalModelFull } from '@/libs/zeroeval-api';
import {
  fetchLeaderboardData,
  leaderboardKeys,
  useLeaderboardData,
  useLeaderboardQuery,
  usePrefetchLeaderboard,
} from './use-leaderboard-query';

const mockModelFull: ZeroEvalModelFull = {
  model_id: 'test-model',
  name: 'Test Model',
  organization: 'Test Org',
  organization_id: 'test-org',
  organization_country: 'US',
  params: 7000000000,
  training_tokens: null,
  context: 128000,
  canonical_model_id: null,
  is_moe: null,
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
  simpleqa_score: null,
  osworld_score: null,
  browsecomp_score: null,
  toolathlon_score: null,
  terminal_bench_score: null,
  tau_bench_retail_score: null,
  arc_agi_v2_score: null,
  mmmlu_score: null,
  charxiv_r_score: null,
  mmmu_pro_score: null,
  screenspot_pro_score: null,
  mcp_atlas_score: null,
  frontiermath_score: null,
  mrcr_v2_score: null,
  scicode_score: null,
  apex_agents_score: null,
  swe_bench_pro_score: null,
};

const mockModelWithArena = {
  ...mockModelFull,
  code_arena_score: 15.0,
  chat_arena_score: 20.5,
  arena_raw_scores: { 'chat-arena': 20.5 },
};

const mockMagiaItem = {
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
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockFetch(responses: Record<string, unknown>) {
  const mockFn = vi.fn((url: string) => {
    for (const [pattern, body] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(body),
        });
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
  vi.stubGlobal('fetch', mockFn);
  return mockFn;
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
    vi.unstubAllGlobals();
  });

  it('fetches "all" category — base models + agents', async () => {
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

    const result = await fetchLeaderboardData('all');

    expect(result).toHaveLength(1);
    expect(result[0]?.model_id).toBe('test-model');
    expect(result[0]?.chat_arena_score).toBeDefined();
    expect(result[0]?.code_arena_score).toBeDefined();
    expect(result[0]?.arena_raw_scores).toBeDefined();
  });

  it('fetches "vision" category — base models only, no agent call', async () => {
    const fetchSpy = mockFetch({
      '/api/base-models': [{ ...mockModelFull, multimodal: true }],
    });

    const result = await fetchLeaderboardData('vision');

    expect(result).toHaveLength(1);
    expect(result[0]?.multimodal).toBe(true);
    // Should only call /api/base-models, not /api/leaderboard
    const urls = fetchSpy.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/api/leaderboard'))).toBe(false);
  });

  it('fetches non-LLM categories via /api/arena-entries', async () => {
    mockFetch({
      '/api/arena-entries': {
        'text-to-video': { leaderboard: [mockMagiaItem], total_count: 1, limit: 1, offset: 0 },
        'image-to-video': { leaderboard: [], total_count: 0, limit: 0, offset: 0 },
        'video-editing': { leaderboard: [], total_count: 0, limit: 0, offset: 0 },
      },
    });

    const result = await fetchLeaderboardData('video-generation');

    expect(result).toHaveLength(1);
    expect(result[0]?.model_id).toBe('basic-model');
    expect((result[0] as unknown as Record<string, unknown>)['text-to-video']).toBeDefined();
  });

  it('returns empty array when /api/base-models fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })),
    );

    const result = await fetchLeaderboardData('all');
    expect(result).toEqual([]);
  });

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error'))),
    );

    const result = await fetchLeaderboardData('all');
    expect(result).toEqual([]);
  });
});

describe('useLeaderboardQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches leaderboard data for "all" category', async () => {
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

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

  it('fetches leaderboard data for "vision" category', async () => {
    mockFetch({
      '/api/base-models': [{ ...mockModelFull, multimodal: true }],
    });

    const { result } = renderHook(() => useLeaderboardQuery('vision'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0]?.multimodal).toBe(true);
  });

  it('returns empty array when API returns no data', async () => {
    mockFetch({
      '/api/base-models': [],
      '/api/leaderboard': { data: [] },
    });

    const { result } = renderHook(() => useLeaderboardQuery('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('fetches non-LLM categories via arena entries', async () => {
    mockFetch({
      '/api/arena-entries': {
        'text-to-video': { leaderboard: [mockMagiaItem], total_count: 1, limit: 1, offset: 0 },
        'image-to-video': { leaderboard: [], total_count: 0, limit: 0, offset: 0 },
        'video-editing': { leaderboard: [], total_count: 0, limit: 0, offset: 0 },
      },
    });

    const { result } = renderHook(() => useLeaderboardQuery('video-generation'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
  });
});

describe('useLeaderboardData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('provides derived loading states', async () => {
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

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
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

    const { result } = renderHook(() => useLeaderboardData('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.length).toBe(1);
  });
});

describe('usePrefetchLeaderboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefetches leaderboard data for a category', async () => {
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchLeaderboard(), { wrapper });
    expect(typeof result.current.prefetchLeaderboard).toBe('function');

    await result.current.prefetchLeaderboard('all');

    const cachedData = queryClient.getQueryData(['leaderboard', 'all']);
    expect(Array.isArray(cachedData)).toBe(true);
  });

  it('defaults to "all" category when none provided', async () => {
    mockFetch({
      '/api/base-models': [mockModelWithArena],
      '/api/leaderboard': { data: [] },
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchLeaderboard(), { wrapper });
    await result.current.prefetchLeaderboard();

    const cachedData = queryClient.getQueryData(['leaderboard', 'all']);
    expect(cachedData).toBeDefined();
  });
});
