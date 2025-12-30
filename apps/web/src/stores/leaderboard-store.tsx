'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  getArenaScores,
  LeaderboardCategory,
  ZeroEvalModelBasic,
  ZeroEvalModelFull,
} from '@/libs/zeroeval-api';

// Same type as used in page.tsx
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

export type LeaderboardState = {
  dataByCategory: Partial<Record<LeaderboardCategory, ModelWithArena[]>>;
  lastUpdatedByCategory: Partial<Record<LeaderboardCategory, Date>>;
};

export type LeaderboardActions = {
  getCachedData: (category: LeaderboardCategory) => ModelWithArena[] | null;
  setCachedData: (category: LeaderboardCategory, data: ModelWithArena[]) => void;
  getLastUpdated: (category: LeaderboardCategory) => Date | null;
};

export type LeaderboardStore = LeaderboardState & LeaderboardActions;

export const useLeaderboardStore = create<LeaderboardStore>()(
  devtools(
    (set, get) => ({
      dataByCategory: {},
      lastUpdatedByCategory: {},

      getCachedData: (category) => get().dataByCategory[category] ?? null,

      setCachedData: (category, data) =>
        set(
          (state) => ({
            dataByCategory: { ...state.dataByCategory, [category]: data },
            lastUpdatedByCategory: { ...state.lastUpdatedByCategory, [category]: new Date() },
          }),
          false,
          'leaderboard/setCachedData',
        ),

      getLastUpdated: (category) => get().lastUpdatedByCategory[category] ?? null,
    }),
    { name: 'leaderboard-store', enabled: process.env.NODE_ENV === 'development' },
  ),
);

export const leaderboardSelectors = {
  dataByCategory: (state: LeaderboardStore) => state.dataByCategory,
  lastUpdatedByCategory: (state: LeaderboardStore) => state.lastUpdatedByCategory,
};
