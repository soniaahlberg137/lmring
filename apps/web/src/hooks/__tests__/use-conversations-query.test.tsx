import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  conversationsKeys,
  fetchConversations,
  useHistoryConversations,
  usePrefetchConversations,
  useRecentConversations,
} from '../use-conversations-query';

const mockConversation = {
  id: 'conv-1',
  title: 'Test Conversation',
  firstMessage: 'Hello world',
  updatedAt: '2025-01-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
};

const mockConversationWithModels = {
  ...mockConversation,
  models: [{ id: 'model-1', name: 'GPT-4' }],
  votes: [{ modelId: 'model-1', vote: 'up' }],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('conversationsKeys', () => {
  it('generates correct key for all conversations', () => {
    expect(conversationsKeys.all).toEqual(['conversations']);
  });

  it('generates correct key for recent conversations', () => {
    expect(conversationsKeys.recent(10)).toEqual(['conversations', 'recent', 10]);
    expect(conversationsKeys.recent(5)).toEqual(['conversations', 'recent', 5]);
  });

  it('generates correct key for history conversations', () => {
    expect(conversationsKeys.history(50, 0)).toEqual([
      'conversations',
      'history',
      { limit: 50, offset: 0 },
    ]);
    expect(conversationsKeys.history(20, 40)).toEqual([
      'conversations',
      'history',
      { limit: 20, offset: 40 },
    ]);
  });
});

describe('fetchConversations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches conversations with default parameters', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversation] }),
    } as Response);

    const result = await fetchConversations();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/conversations?limit=50&offset=0&withFirstMessage=true',
    );
    expect(result).toEqual([mockConversation]);
  });

  it('fetches conversations with custom parameters', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversationWithModels] }),
    } as Response);

    const result = await fetchConversations({
      limit: 20,
      offset: 10,
      withFirstMessage: true,
      withModels: true,
      withVotes: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/conversations?limit=20&offset=10&withFirstMessage=true&withModels=true&withVotes=true',
    );
    expect(result).toEqual([mockConversationWithModels]);
  });

  it('throws error when API returns error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    await expect(fetchConversations()).rejects.toThrow('Unauthorized');
  });

  it('throws default error message when API error has no message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(fetchConversations()).rejects.toThrow('Failed to get conversations');
  });
});

describe('useRecentConversations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches recent conversations with default limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversation] }),
    } as Response);

    const { result } = renderHook(() => useRecentConversations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockConversation]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/conversations?limit=10&offset=0&withFirstMessage=true',
    );
  });

  it('fetches recent conversations with custom limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversation] }),
    } as Response);

    const { result } = renderHook(() => useRecentConversations(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/conversations?limit=5&offset=0&withFirstMessage=true',
    );
  });

  it('handles API error correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    } as Response);

    const { result } = renderHook(() => useRecentConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('API Error');
  });
});

describe('useHistoryConversations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches history conversations with models and votes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversationWithModels] }),
    } as Response);

    const { result } = renderHook(() => useHistoryConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockConversationWithModels]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/conversations?limit=50&offset=0&withFirstMessage=true&withModels=true&withVotes=true',
    );
  });

  it('supports pagination with offset', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [] }),
    } as Response);

    const { result } = renderHook(() => useHistoryConversations(20, 40), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/conversations?limit=20&offset=40&withFirstMessage=true&withModels=true&withVotes=true',
    );
  });
});

describe('usePrefetchConversations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefetches recent conversations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversation] }),
    } as Response);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchConversations(), { wrapper });

    expect(typeof result.current.prefetchRecentConversations).toBe('function');
    expect(typeof result.current.prefetchHistoryConversations).toBe('function');

    await result.current.prefetchRecentConversations(10);

    const cachedData = queryClient.getQueryData(conversationsKeys.recent(10));
    expect(cachedData).toBeDefined();
    expect(Array.isArray(cachedData)).toBe(true);
  });

  it('prefetches history conversations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [mockConversationWithModels] }),
    } as Response);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchConversations(), { wrapper });

    await result.current.prefetchHistoryConversations(50, 0);

    const cachedData = queryClient.getQueryData(conversationsKeys.history(50, 0));
    expect(cachedData).toBeDefined();
    expect(Array.isArray(cachedData)).toBe(true);
  });

  it('uses default values when no parameters provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [] }),
    } as Response);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePrefetchConversations(), { wrapper });

    await result.current.prefetchRecentConversations();
    await result.current.prefetchHistoryConversations();

    // Default limit for recent is 10
    expect(queryClient.getQueryData(conversationsKeys.recent(10))).toBeDefined();
    // Default limit for history is 50, offset is 0
    expect(queryClient.getQueryData(conversationsKeys.history(50, 0))).toBeDefined();
  });
});
