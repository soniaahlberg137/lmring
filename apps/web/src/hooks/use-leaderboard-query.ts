import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  type ArenaScores,
  CATEGORY_ARENA_NAMES,
  type LeaderboardCategory,
  type MagiaLeaderboardItem,
  type MagiaLeaderboardResponse,
  type ZeroEvalModelBasic,
  type ZeroEvalModelFull,
} from '@/libs/zeroeval-api';

// Model type with optional arena scores and agent-specific fields
export type ModelWithArena = (ZeroEvalModelFull | ZeroEvalModelBasic) & {
  code_arena_score?: number | null;
  chat_arena_score?: number | null;
  arena_raw_scores?: ArenaScores | null;
  // Agent display name when this row represents a submitted Tessera agent
  agent_name?: string | null;
  domain?: 'coding' | 'customer-support' | 'research' | 'finance' | 'legal' | 'general' | null;
  description?: string | null;
  system_prompt?: string | null;
  mcp_tools?: string[] | null;
  is_evaluating?: boolean;
  // HAL benchmark scores — agents only; ZeroEval base models never had these
  gaia_score?: number | null;
  tau_bench_score?: number | null;
  core_bench_score?: number | null;
  // Non-LLM arena scores (flattened onto the row for non-LLM category tabs)
  'text-to-image'?: number | null;
  'image-to-image'?: number | null;
  'text-to-video'?: number | null;
  'image-to-video'?: number | null;
  'video-editing'?: number | null;
  'text-to-speech'?: number | null;
  'speech-to-text'?: number | null;
};

async function fetchBaseModels(): Promise<ModelWithArena[]> {
  try {
    const res = await fetch('/api/base-models');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

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

async function fetchArenaEntries(
  arenas: readonly string[],
): Promise<Record<string, MagiaLeaderboardResponse>> {
  try {
    const params = new URLSearchParams({ arenas: arenas.join(',') });
    const res = await fetch(`/api/arena-entries?${params}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function fetchLeaderboardData(
  category: LeaderboardCategory,
): Promise<ModelWithArena[]> {
  if (category === 'vision' || category === 'all') {
    const [models, submittedAgents] = await Promise.all([
      fetchBaseModels(),
      category === 'all' ? fetchAgentsWithScores() : Promise.resolve([]),
    ]);
    return category === 'all' ? [...models, ...submittedAgents] : models;
  }

  // Non-LLM categories: load from arena entries snapshot
  // NOTE: conservative_rating ×100 multiplication preserves previous display
  // behaviour — this scaling may also need auditing (see schema.ts SCALE WARNING).
  const arenaNames = CATEGORY_ARENA_NAMES[category];
  const arenaData = await fetchArenaEntries(arenaNames);

  const modelMap = new Map<string, ModelWithArena & { _magiaItem: MagiaLeaderboardItem }>();

  for (const arenaName of arenaNames) {
    const items = arenaData[arenaName as string]?.leaderboard ?? [];

    for (const item of items) {
      const existing = modelMap.get(item.model_id);
      if (existing) {
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

  return Array.from(modelMap.values()).map(({ _magiaItem, ...model }) => model);
}

// Query key factory for hierarchical invalidation
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  category: (category: LeaderboardCategory) => ['leaderboard', category] as const,
};

export function useLeaderboardQuery(category: LeaderboardCategory) {
  return useQuery({
    queryKey: leaderboardKeys.category(category),
    queryFn: () => fetchLeaderboardData(category),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useLeaderboardData(category: LeaderboardCategory) {
  const query = useLeaderboardQuery(category);

  return {
    ...query,
    isInitialLoading: query.isPending && query.isFetching,
    isRefetching: !query.isPending && query.isFetching,
  };
}

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
