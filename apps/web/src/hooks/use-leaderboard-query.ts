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

// Model type with optional arena scores
export type ModelWithArena = (ZeroEvalModelFull | ZeroEvalModelBasic) & {
  code_arena_score?: number | null;
  chat_arena_score?: number | null;
  arena_raw_scores?: Awaited<ReturnType<typeof getArenaScores>>[string] | null;
  // Tessera: agent display name when this row represents a submitted agent
  agent_name?: string | null;
  domain?: 'coding' | 'customer-support' | 'research' | 'finance' | 'legal' | 'general' | null;
  description?: string | null;
  system_prompt?: string | null;
  mcp_tools?: string[] | null;
  is_evaluating?: boolean;
  // Non-LLM arena scores (flattened)
  'text-to-image'?: number | null;
  'image-to-image'?: number | null;
  'text-to-video'?: number | null;
  'image-to-video'?: number | null;
  'video-editing'?: number | null;
  'text-to-speech'?: number | null;
  'speech-to-text'?: number | null;
};

async function fetchAgentsWithScores(): Promise<ModelWithArena[]> {
  try {
    const res = await fetch('/api/leaderboard?type=agents');
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as ModelWithArena[];
  } catch {
    return [];
  }
}

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
    const [models, submittedAgents] = await Promise.all([
      getModelsFull(false),
      fetchAgentsWithScores(),
    ]);
    const modelIds = models.map((m) => m.model_id);
    let arenaData: Awaited<ReturnType<typeof getArenaScores>> = {};
    try {
      arenaData = await getArenaScores(modelIds);
    } catch {
      console.warn('Failed to fetch arena scores, continuing without them');
    }

    const zeroEvalModels = models.map((model) => {
      const arenaScores = arenaData[model.model_id];
      return {
        ...model,
        code_arena_score: arenaScores ? calculateCodeArenaScore(arenaScores) : null,
        chat_arena_score: arenaScores ? calculateChatArenaScore(arenaScores) : null,
        arena_raw_scores: arenaScores || null,
      };
    });

    return [...zeroEvalModels, ...submittedAgents];
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
