import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import store after mocking
import { type ComparisonVoteData, useVoteStore, voteSelectors } from './vote-store';

describe('vote-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVoteStore.setState({
      votes: new Map(),
      hoveredVote: null,
      loadingStates: new Map(),
      isSubmitting: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should have empty votes map', () => {
      const state = useVoteStore.getState();
      expect(state.votes.size).toBe(0);
    });

    it('should have null hoveredVote', () => {
      const state = useVoteStore.getState();
      expect(state.hoveredVote).toBeNull();
    });

    it('should have empty loadingStates map', () => {
      const state = useVoteStore.getState();
      expect(state.loadingStates.size).toBe(0);
    });

    it('should have isSubmitting as false', () => {
      const state = useVoteStore.getState();
      expect(state.isSubmitting).toBe(false);
    });
  });

  describe('setVote / clearVote / getVote', () => {
    const mockVote: ComparisonVoteData = {
      id: 'vote-1',
      messageId: 'msg-1',
      comparisonType: 'text',
      voteType: 'winner',
      winnerId: 'response-1',
      results: [
        {
          modelResponseId: 'response-1',
          modelName: 'gpt-4',
          providerName: 'openai',
          outcome: 'winner',
        },
        {
          modelResponseId: 'response-2',
          modelName: 'claude-3',
          providerName: 'anthropic',
          outcome: 'loser',
        },
      ],
    };

    it('should set a vote for a message', () => {
      useVoteStore.getState().setVote('msg-1', mockVote);

      const vote = useVoteStore.getState().getVote('msg-1');
      expect(vote).toEqual(mockVote);
    });

    it('should clear a vote for a message', () => {
      useVoteStore.getState().setVote('msg-1', mockVote);
      useVoteStore.getState().clearVote('msg-1');

      const vote = useVoteStore.getState().getVote('msg-1');
      expect(vote).toBeUndefined();
    });

    it('should return undefined for non-existent vote', () => {
      const vote = useVoteStore.getState().getVote('non-existent');
      expect(vote).toBeUndefined();
    });

    it('should handle multiple votes', () => {
      const vote2: ComparisonVoteData = {
        ...mockVote,
        id: 'vote-2',
        messageId: 'msg-2',
      };

      useVoteStore.getState().setVote('msg-1', mockVote);
      useVoteStore.getState().setVote('msg-2', vote2);

      expect(useVoteStore.getState().votes.size).toBe(2);
      expect(useVoteStore.getState().getVote('msg-1')).toEqual(mockVote);
      expect(useVoteStore.getState().getVote('msg-2')).toEqual(vote2);
    });
  });

  describe('setHoveredVote', () => {
    it('should set hovered vote', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      expect(useVoteStore.getState().hoveredVote).toEqual({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });
    });

    it('should clear hovered vote when set to null', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });
      useVoteStore.getState().setHoveredVote(null);

      expect(useVoteStore.getState().hoveredVote).toBeNull();
    });
  });

  describe('setLoading / setSubmitting', () => {
    it('should set loading state for a message', () => {
      useVoteStore.getState().setLoading('msg-1', true);

      expect(useVoteStore.getState().loadingStates.get('msg-1')).toBe(true);
    });

    it('should remove loading state when set to false', () => {
      useVoteStore.getState().setLoading('msg-1', true);
      useVoteStore.getState().setLoading('msg-1', false);

      expect(useVoteStore.getState().loadingStates.has('msg-1')).toBe(false);
    });

    it('should set submitting state', () => {
      useVoteStore.getState().setSubmitting(true);

      expect(useVoteStore.getState().isSubmitting).toBe(true);
    });
  });

  describe('clearAllVotes', () => {
    it('should clear all votes and states', () => {
      useVoteStore.getState().setVote('msg-1', {
        id: 'vote-1',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-1',
        results: [],
      });
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });
      useVoteStore.getState().setLoading('msg-1', true);

      useVoteStore.getState().clearAllVotes();

      const state = useVoteStore.getState();
      expect(state.votes.size).toBe(0);
      expect(state.hoveredVote).toBeNull();
      expect(state.loadingStates.size).toBe(0);
    });
  });

  describe('getVoteStateForResponse', () => {
    it('should return "none" when no vote exists', () => {
      const result = useVoteStore.getState().getVoteStateForResponse('msg-1', 'response-1');
      expect(result).toBe('none');
    });

    it('should return outcome for existing vote', () => {
      useVoteStore.getState().setVote('msg-1', {
        id: 'vote-1',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-1',
        results: [
          {
            modelResponseId: 'response-1',
            modelName: 'gpt-4',
            providerName: 'openai',
            outcome: 'winner',
          },
        ],
      });

      const result = useVoteStore.getState().getVoteStateForResponse('msg-1', 'response-1');
      expect(result).toBe('winner');
    });

    it('should return "none" for non-matching response id', () => {
      useVoteStore.getState().setVote('msg-1', {
        id: 'vote-1',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-1',
        results: [
          {
            modelResponseId: 'response-1',
            modelName: 'gpt-4',
            providerName: 'openai',
            outcome: 'winner',
          },
        ],
      });

      const result = useVoteStore.getState().getVoteStateForResponse('msg-1', 'response-99');
      expect(result).toBe('none');
    });
  });

  describe('getHoverStateForResponse', () => {
    it('should return null when no hovered vote', () => {
      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-1', ['response-1', 'response-2']);
      expect(result).toBeNull();
    });

    it('should return null when hovered vote is for different message', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-2',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-1', ['response-1', 'response-2']);
      expect(result).toBeNull();
    });

    it('should return null when modelResponseId not in participantIds', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-3', ['response-1', 'response-2']);
      expect(result).toBeNull();
    });

    it('should return "winner" for winner voteType matching winnerId', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-1', ['response-1', 'response-2']);
      expect(result).toBe('winner');
    });

    it('should return "loser" for winner voteType not matching winnerId', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-2', ['response-1', 'response-2']);
      expect(result).toBe('loser');
    });

    it('should return "tie" for tie voteType', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'tie',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-1', ['response-1', 'response-2']);
      expect(result).toBe('tie');
    });

    it('should return "all_bad" for all_bad voteType', () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'all_bad',
      });

      const result = useVoteStore
        .getState()
        .getHoverStateForResponse('msg-1', 'response-1', ['response-1', 'response-2']);
      expect(result).toBe('all_bad');
    });
  });

  describe('loadVoteForMessage (async)', () => {
    it('should load vote successfully', async () => {
      const mockVoteResponse = {
        vote: {
          id: 'vote-1',
          messageId: 'msg-1',
          comparisonType: 'text',
          voteType: 'winner',
          winnerId: 'response-1',
          results: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoteResponse),
      });

      const result = await useVoteStore.getState().loadVoteForMessage('msg-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/comparison-votes?messageId=msg-1');
      expect(result).toEqual(mockVoteResponse.vote);
      expect(useVoteStore.getState().getVote('msg-1')).toEqual(mockVoteResponse.vote);
    });

    it('should return null when no vote exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vote: null }),
      });

      const result = await useVoteStore.getState().loadVoteForMessage('msg-1');

      expect(result).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await useVoteStore.getState().loadVoteForMessage('msg-1');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should manage loading state during fetch', async () => {
      let resolvePromise!: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const loadPromise = useVoteStore.getState().loadVoteForMessage('msg-1');

      // Loading should be true during fetch
      expect(useVoteStore.getState().loadingStates.get('msg-1')).toBe(true);

      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ vote: null }),
      });

      await loadPromise;

      // Loading should be false after fetch
      expect(useVoteStore.getState().loadingStates.has('msg-1')).toBe(false);
    });
  });

  describe('submitVote (async)', () => {
    const submitParams = {
      messageId: 'msg-1',
      voteType: 'winner' as const,
      winnerId: 'response-1',
      comparisonType: 'text' as const,
      participantIds: ['response-1', 'response-2'],
    };

    it('should submit vote successfully', async () => {
      const mockVoteResponse = {
        vote: {
          id: 'vote-1',
          messageId: 'msg-1',
          comparisonType: 'text',
          voteType: 'winner',
          winnerId: 'response-1',
          results: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVoteResponse),
      });

      const result = await useVoteStore.getState().submitVote(submitParams);

      expect(mockFetch).toHaveBeenCalledWith('/api/comparison-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitParams),
      });
      expect(result).toEqual(mockVoteResponse.vote);
      expect(useVoteStore.getState().getVote('msg-1')).toEqual(mockVoteResponse.vote);
    });

    it('should clear hovered vote on submit', async () => {
      useVoteStore.getState().setHoveredVote({
        messageId: 'msg-1',
        voteType: 'winner',
        winnerId: 'response-1',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vote: null }),
      });

      await useVoteStore.getState().submitVote(submitParams);

      expect(useVoteStore.getState().hoveredVote).toBeNull();
    });

    it('should handle 409 conflict by reloading existing vote', async () => {
      const existingVote = {
        id: 'existing-vote',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-2',
        results: [],
      };

      // First call returns 409
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      // Second call is loadVoteForMessage
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vote: existingVote }),
      });

      const result = await useVoteStore.getState().submitVote(submitParams);

      expect(result).toEqual(existingVote);
    });

    it('should handle submit failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await useVoteStore.getState().submitVote(submitParams);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should manage submitting state during submit', async () => {
      let resolvePromise!: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const submitPromise = useVoteStore.getState().submitVote(submitParams);

      expect(useVoteStore.getState().isSubmitting).toBe(true);

      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ vote: null }),
      });

      await submitPromise;

      expect(useVoteStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('deleteVote (async)', () => {
    it('should delete vote successfully', async () => {
      useVoteStore.getState().setVote('msg-1', {
        id: 'vote-1',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-1',
        results: [],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await useVoteStore.getState().deleteVote('msg-1');

      expect(result).toBe(true);
      expect(useVoteStore.getState().getVote('msg-1')).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('/api/comparison-votes?messageId=msg-1', {
        method: 'DELETE',
      });
    });

    it('should handle delete failure', async () => {
      useVoteStore.getState().setVote('msg-1', {
        id: 'vote-1',
        messageId: 'msg-1',
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: 'response-1',
        results: [],
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await useVoteStore.getState().deleteVote('msg-1');

      expect(result).toBe(false);
      // Vote should still exist
      expect(useVoteStore.getState().getVote('msg-1')).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('should manage submitting state during delete', async () => {
      let resolvePromise!: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const deletePromise = useVoteStore.getState().deleteVote('msg-1');

      expect(useVoteStore.getState().isSubmitting).toBe(true);

      resolvePromise({ ok: true });

      await deletePromise;

      expect(useVoteStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('selectors', () => {
    it('votes selector should return votes map', () => {
      const state = useVoteStore.getState();
      expect(voteSelectors.votes(state)).toBe(state.votes);
    });

    it('hoveredVote selector should return hoveredVote', () => {
      const state = useVoteStore.getState();
      expect(voteSelectors.hoveredVote(state)).toBe(state.hoveredVote);
    });

    it('isSubmitting selector should return isSubmitting', () => {
      const state = useVoteStore.getState();
      expect(voteSelectors.isSubmitting(state)).toBe(state.isSubmitting);
    });

    it('isLoading selector should return loading state for message', () => {
      useVoteStore.getState().setLoading('msg-1', true);

      const state = useVoteStore.getState();
      expect(voteSelectors.isLoading('msg-1')(state)).toBe(true);
      expect(voteSelectors.isLoading('msg-2')(state)).toBe(false);
    });
  });
});
