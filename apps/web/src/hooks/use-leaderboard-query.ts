import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  CATEGORY_CONFIGS,
  calculateCategoryArenaScores,
  calculateChatArenaScore,
  calculateCodeArenaScore,
  getArenaScores,
  getArenaScoresForCategory,
  getModelsAll,
  getModelsFull,
  type LeaderboardCategory,
  type ModelsAllParams,
  type ZeroEvalModelBasic,
  type ZeroEvalModelFull,
} from '@/libs/zeroeval-api';

// Model type with optional arena scores
export type ModelWithArena = (ZeroEvalModelFull | ZeroEvalModelBasic) & {
  code_arena_score?: number | null;
  chat_arena_score?: number | null;
  arena_raw_scores?: Awaited<ReturnType<typeof getArenaScores>>[string] | null;
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
  const config = CATEGORY_CONFIGS.find((c) => c.id === category);

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

  // Other categories
  const apiParams: ModelsAllParams = config?.apiParams || {};
  const basicModels = await getModelsAll(apiParams);
  const modelIds = basicModels.map((m) => m.model_id);

  let arenaData: Awaited<ReturnType<typeof getArenaScoresForCategory>> = {};
  try {
    arenaData = await getArenaScoresForCategory(modelIds, category);
  } catch {
    console.warn('Failed to fetch arena scores, continuing without them');
  }

  return basicModels.map((model) => {
    const arenaScores = arenaData[model.model_id];
    const convertedScores = arenaScores ? calculateCategoryArenaScores(arenaScores, category) : {};
    return {
      ...model,
      arena_raw_scores: arenaScores || null,
      ...convertedScores,
    };
  });
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
