import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { MOCK_BENCHMARK_DATA } from '@/libs/mock-benchmark-data';
import {
  CATEGORY_ARENA_NAMES,
  calculateChatArenaScore,
  calculateCodeArenaScore,
  getArenaScores,
  getMagiaLeaderboard,
  getModelsFull,
  type LeaderboardCategory,
  type MagiaLeaderboardItem,
  type ZeroEvalModelBasic,
  type ZeroEvalModelFull,
} from '@/libs/zeroeval-api';

// Tessera: assembled-agent (harness × model) leaderboard row.
// Mirrors the v0 contract (§2) for `GET /api/leaderboard?domain=legal`.
export type AssembledAgentRow = {
  runId: string;
  agentName: string; // agents.name (display name of the assembled agent)
  harness: string; // 'oh-my-claudecode' | 'bare-agent.md'
  baseModel: string; // eval_runs.modelId
  organization: string | null;
  domain: string;
  suite: string;
  f1: number | null;
  passAt1: number | null;
  passHatK: number | null;
  k: number;
  costUsd: number | null;
  latencyMs: number | null;
  totalTokens: number | null;
  createdAt: string; // ISO
};

// Model type with optional arena scores
export type ModelWithArena = (ZeroEvalModelFull | ZeroEvalModelBasic) & {
  code_arena_score?: number | null;
  chat_arena_score?: number | null;
  arena_raw_scores?: Awaited<ReturnType<typeof getArenaScores>>[string] | null;
  // Tessera: agent display name when this row represents a submitted agent
  agent_name?: string | null;
  // Non-LLM arena scores (flattened)
  'text-to-image'?: number | null;
  'image-to-image'?: number | null;
  'text-to-video'?: number | null;
  'image-to-video'?: number | null;
  'video-editing'?: number | null;
  'text-to-speech'?: number | null;
  'speech-to-text'?: number | null;
};

export async function fetchLeaderboardData(
  category: LeaderboardCategory,
): Promise<ModelWithArena[]> {
  if (process.env.NEXT_PUBLIC_TESSERA_MOCK_BENCHMARKS === 'true') {
    return MOCK_BENCHMARK_DATA;
  }

  if (category === 'vision') {
    const models = await getModelsFull(true);
    const modelIds = models.map((m) => m.model_id);
    let arenaData: Awaited<ReturnType<typeof getArenaScores>> = {};
    try {
      arenaData = await getArenaScores(modelIds);
    } catch {
      console.warn('Failed to fetch arena scores, continuing without them');
    }

    return models.map((model) => {
      const arenaScores = arenaData[model.model_id];
      return {
        ...model,
        code_arena_score: arenaScores ? calculateCodeArenaScore(arenaScores) : null,
        chat_arena_score: arenaScores ? calculateChatArenaScore(arenaScores) : null,
        arena_raw_scores: arenaScores || null,
      };
    });
  }

  if (category === 'all') {
    const models = await getModelsFull(false);
    const modelIds = models.map((m) => m.model_id);
    let arenaData: Awaited<ReturnType<typeof getArenaScores>> = {};
    try {
      arenaData = await getArenaScores(modelIds);
    } catch {
      console.warn('Failed to fetch arena scores, continuing without them');
    }

    return models.map((model) => {
      const arenaScores = arenaData[model.model_id];
      return {
        ...model,
        code_arena_score: arenaScores ? calculateCodeArenaScore(arenaScores) : null,
        chat_arena_score: arenaScores ? calculateChatArenaScore(arenaScores) : null,
        arena_raw_scores: arenaScores || null,
      };
    });
  }

  // Non-LLM categories: use magia leaderboard API
  const arenaNames = CATEGORY_ARENA_NAMES[category];
  const leaderboardResults = await Promise.all(
    arenaNames.map((arena) => getMagiaLeaderboard(arena as string)),
  );

  // Merge models across arenas, deduplicating by model_id
  const modelMap = new Map<string, ModelWithArena & { _magiaItem: MagiaLeaderboardItem }>();

  for (let i = 0; i < arenaNames.length; i++) {
    const arenaName = arenaNames[i] as string;
    const items = leaderboardResults[i]?.leaderboard ?? [];

    for (const item of items) {
      const existing = modelMap.get(item.model_id);
      if (existing) {
        // Add this arena's score to the existing model
        (existing as unknown as Record<string, unknown>)[arenaName] =
          Math.round(item.conservative_rating * 100 * 100) / 100;
      } else {
        const model: ModelWithArena & { _magiaItem: MagiaLeaderboardItem } = {
          model_id: item.model_id,
          name: item.model_name,
          organization: item.organization,
          organization_id: item.organization.toLowerCase().replace(/\s+/g, '-'),
          announcement_date: item.announcement_date,
          release_date: null,
          multimodal: false,
          license: item.license,
          is_open: item.is_open_source,
          model_type:
            category === 'image-generation'
              ? 'image'
              : category === 'video-generation'
                ? 'video'
                : category === 'text-to-speech'
                  ? 'tts'
                  : 'stt',
          input_modalities: [],
          output_modalities: [],
          input_price: item.input_price != null ? String(item.input_price) : null,
          output_price: item.output_price != null ? String(item.output_price) : null,
          arena_raw_scores: null,
          [arenaName]: Math.round(item.conservative_rating * 100 * 100) / 100,
          _magiaItem: item,
        };
        modelMap.set(item.model_id, model);
      }
    }
  }

  // Remove internal _magiaItem field before returning
  return Array.from(modelMap.values()).map(({ _magiaItem, ...model }) => model);
}

// Query key factory for hierarchical invalidation (Best Practice #2)
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  category: (category: LeaderboardCategory) => ['leaderboard', category] as const,
};

export function useLeaderboardQuery(category: LeaderboardCategory) {
  return useQuery({
    queryKey: leaderboardKeys.category(category),
    queryFn: () => fetchLeaderboardData(category),
    staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection (Best Practice #3)
    refetchOnWindowFocus: false, // (Best Practice #5)
  });
}

// Helper hook that returns derived loading states (v5 pattern)
export function useLeaderboardData(category: LeaderboardCategory) {
  const query = useLeaderboardQuery(category);

  return {
    ...query,
    // isPending = no data yet, isLoading = isPending && isFetching (v5 Best Practice #1)
    isInitialLoading: query.isPending && query.isFetching,
    isRefetching: !query.isPending && query.isFetching,
  };
}

// ============================================================================
// Tessera: legal assembled-agent leaderboard (fixture-backed via API)
// ============================================================================

const LEGAL_SUITE = 'legal_contract_review';

export const legalLeaderboardKeys = {
  all: ['leaderboard', 'legal'] as const,
  suite: (suite: string) => ['leaderboard', 'legal', suite] as const,
};

export async function fetchLegalLeaderboard(
  suite: string = LEGAL_SUITE,
): Promise<AssembledAgentRow[]> {
  const params = new URLSearchParams({ domain: 'legal', suite });
  const response = await fetch(`/api/leaderboard?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch legal leaderboard: ${response.status}`);
  }
  const json = (await response.json()) as { rows?: AssembledAgentRow[] };
  return json.rows ?? [];
}

export function useLegalLeaderboardQuery(enabled: boolean, suite: string = LEGAL_SUITE) {
  return useQuery({
    queryKey: legalLeaderboardKeys.suite(suite),
    queryFn: () => fetchLegalLeaderboard(suite),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for prefetching leaderboard data on hover or during idle time
 */
export function usePrefetchLeaderboard() {
  const queryClient = useQueryClient();

  const prefetchLeaderboard = useCallback(
    (category: LeaderboardCategory = 'all') => {
      return queryClient.prefetchQuery({
        queryKey: leaderboardKeys.category(category),
        queryFn: () => fetchLeaderboardData(category),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  return { prefetchLeaderboard };
}
