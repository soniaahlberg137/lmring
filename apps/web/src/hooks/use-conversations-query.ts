import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { ConversationData } from './use-conversation';

interface FetchConversationsParams {
  limit?: number;
  offset?: number;
  withFirstMessage?: boolean;
  withModels?: boolean;
  withVotes?: boolean;
  excludeCleared?: boolean;
}

export async function fetchConversations(
  params: FetchConversationsParams = {},
): Promise<ConversationData[]> {
  const {
    limit = 50,
    offset = 0,
    withFirstMessage = true,
    withModels = false,
    withVotes = false,
    excludeCleared = false,
  } = params;

  const searchParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    withFirstMessage: withFirstMessage.toString(),
  });

  if (withModels) {
    searchParams.set('withModels', 'true');
  }
  if (withVotes) {
    searchParams.set('withVotes', 'true');
  }
  if (excludeCleared) {
    searchParams.set('excludeCleared', 'true');
  }

  const response = await fetch(`/api/conversations?${searchParams.toString()}`);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to get conversations');
  }

  const data = await response.json();
  return data.conversations;
}

// Query key factory for hierarchical invalidation
export const conversationsKeys = {
  all: ['conversations'] as const,
  recent: (limit: number) => ['conversations', 'recent', limit] as const,
  history: (limit: number, offset: number) =>
    ['conversations', 'history', { limit, offset }] as const,
};

/**
 * Hook for fetching recent conversations (sidebar)
 */
export function useRecentConversations(limit = 10) {
  return useQuery({
    queryKey: conversationsKeys.recent(limit),
    queryFn: () =>
      fetchConversations({
        limit,
        withFirstMessage: true,
        withModels: false,
        withVotes: false,
        excludeCleared: true,
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes - recent conversations may change more often
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching history page conversations with full model and vote info
 */
export function useHistoryConversations(limit = 50, offset = 0) {
  return useQuery({
    queryKey: conversationsKeys.history(limit, offset),
    queryFn: () =>
      fetchConversations({
        limit,
        offset,
        withFirstMessage: true,
        withModels: true,
        withVotes: true,
      }),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for prefetching data on hover or during idle time
 */
export function usePrefetchConversations() {
  const queryClient = useQueryClient();

  const prefetchRecentConversations = useCallback(
    (limit = 10) => {
      return queryClient.prefetchQuery({
        queryKey: conversationsKeys.recent(limit),
        queryFn: () =>
          fetchConversations({
            limit,
            withFirstMessage: true,
            withModels: false,
            withVotes: false,
            excludeCleared: true,
          }),
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient],
  );

  const prefetchHistoryConversations = useCallback(
    (limit = 50, offset = 0) => {
      return queryClient.prefetchQuery({
        queryKey: conversationsKeys.history(limit, offset),
        queryFn: () =>
          fetchConversations({
            limit,
            offset,
            withFirstMessage: true,
            withModels: true,
            withVotes: true,
          }),
        staleTime: 3 * 60 * 1000,
      });
    },
    [queryClient],
  );

  return {
    prefetchRecentConversations,
    prefetchHistoryConversations,
  };
}
