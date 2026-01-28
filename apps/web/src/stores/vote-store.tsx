'use client';

import type { ComparisonType, VoteOutcome } from '@lmring/database';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Represents a single model's vote result
 */
export interface VoteResult {
  modelResponseId: string;
  modelName: string;
  providerName: string;
  outcome: VoteOutcome;
}

/**
 * Represents a comparison vote
 */
export interface ComparisonVoteData {
  id: string;
  messageId: string;
  comparisonType: ComparisonType;
  voteType: 'winner' | 'tie' | 'all_bad';
  winnerId?: string;
  results: VoteResult[];
}

/**
 * Hover preview state for showing visual feedback before committing a vote
 */
export interface HoveredVote {
  messageId: string;
  voteType: 'winner' | 'tie' | 'all_bad';
  winnerId?: string;
}

export type VoteState = {
  /**
   * Map of messageId -> vote data
   * Stores all loaded votes for quick access
   */
  votes: Map<string, ComparisonVoteData>;

  /**
   * Current hover preview state
   * Used to show visual feedback when hovering over vote options
   */
  hoveredVote: HoveredVote | null;

  /**
   * Loading states for each message
   */
  loadingStates: Map<string, boolean>;

  /**
   * Submission state
   */
  isSubmitting: boolean;
};

export type VoteActions = {
  /**
   * Set a vote for a message
   */
  setVote: (messageId: string, vote: ComparisonVoteData) => void;

  /**
   * Clear a vote for a message
   */
  clearVote: (messageId: string) => void;

  /**
   * Get vote for a specific message
   */
  getVote: (messageId: string) => ComparisonVoteData | undefined;

  /**
   * Set hover preview state
   */
  setHoveredVote: (hovered: HoveredVote | null) => void;

  /**
   * Set loading state for a message
   */
  setLoading: (messageId: string, loading: boolean) => void;

  /**
   * Set submitting state
   */
  setSubmitting: (submitting: boolean) => void;

  /**
   * Load vote from API for a specific message
   */
  loadVoteForMessage: (messageId: string) => Promise<ComparisonVoteData | null>;

  /**
   * Submit a vote to the API
   */
  submitVote: (params: {
    messageId: string;
    voteType: 'winner' | 'tie' | 'all_bad';
    winnerId?: string;
    comparisonType: ComparisonType;
    participantIds: string[];
  }) => Promise<ComparisonVoteData | null>;

  /**
   * Delete a vote
   */
  deleteVote: (messageId: string) => Promise<boolean>;

  /**
   * Clear all votes (useful when changing conversations)
   */
  clearAllVotes: () => void;

  /**
   * Get vote state for a specific model response
   * Returns the outcome if voted, or the hover preview state
   */
  getVoteStateForResponse: (messageId: string, modelResponseId: string) => VoteOutcome | 'none';

  /**
   * Get hover preview state for a specific model response
   */
  getHoverStateForResponse: (
    messageId: string,
    modelResponseId: string,
    participantIds: string[],
  ) => 'winner' | 'loser' | 'tie' | 'all_bad' | null;
};

export type VoteStore = VoteState & VoteActions;

export const useVoteStore = create<VoteStore>()(
  devtools(
    (set, get) => ({
      votes: new Map(),
      hoveredVote: null,
      loadingStates: new Map(),
      isSubmitting: false,

      setVote: (messageId, vote) =>
        set(
          (state) => {
            const newVotes = new Map(state.votes);
            newVotes.set(messageId, vote);
            return { votes: newVotes };
          },
          false,
          'vote/setVote',
        ),

      clearVote: (messageId) =>
        set(
          (state) => {
            const newVotes = new Map(state.votes);
            newVotes.delete(messageId);
            return { votes: newVotes };
          },
          false,
          'vote/clearVote',
        ),

      getVote: (messageId) => get().votes.get(messageId),

      setHoveredVote: (hovered) => set({ hoveredVote: hovered }, false, 'vote/setHoveredVote'),

      setLoading: (messageId, loading) =>
        set(
          (state) => {
            const newLoadingStates = new Map(state.loadingStates);
            if (loading) {
              newLoadingStates.set(messageId, true);
            } else {
              newLoadingStates.delete(messageId);
            }
            return { loadingStates: newLoadingStates };
          },
          false,
          'vote/setLoading',
        ),

      setSubmitting: (submitting) => set({ isSubmitting: submitting }, false, 'vote/setSubmitting'),

      loadVoteForMessage: async (messageId) => {
        const { setLoading, setVote } = get();
        setLoading(messageId, true);

        try {
          const response = await fetch(`/api/comparison-votes?messageId=${messageId}`);
          if (!response.ok) {
            throw new Error('Failed to load vote');
          }

          const data = await response.json();
          if (data.vote) {
            setVote(messageId, data.vote);
            return data.vote;
          }
          return null;
        } catch (error) {
          console.error('Failed to load vote:', error);
          return null;
        } finally {
          setLoading(messageId, false);
        }
      },

      submitVote: async (params) => {
        const { setSubmitting, setVote, setHoveredVote, loadVoteForMessage } = get();
        setSubmitting(true);
        setHoveredVote(null);

        try {
          const response = await fetch('/api/comparison-votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          });

          // Handle duplicate vote - reload existing vote
          if (response.status === 409) {
            const existingVote = await loadVoteForMessage(params.messageId);
            return existingVote;
          }

          if (!response.ok) {
            throw new Error('Failed to submit vote');
          }

          const data = await response.json();
          if (data.vote) {
            setVote(params.messageId, data.vote);
            return data.vote;
          }
          return null;
        } catch (error) {
          console.error('Failed to submit vote:', error);
          return null;
        } finally {
          setSubmitting(false);
        }
      },

      deleteVote: async (messageId) => {
        const { setSubmitting, clearVote } = get();
        setSubmitting(true);

        try {
          const response = await fetch(`/api/comparison-votes?messageId=${messageId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete vote');
          }

          clearVote(messageId);
          return true;
        } catch (error) {
          console.error('Failed to delete vote:', error);
          return false;
        } finally {
          setSubmitting(false);
        }
      },

      clearAllVotes: () =>
        set(
          {
            votes: new Map(),
            hoveredVote: null,
            loadingStates: new Map(),
          },
          false,
          'vote/clearAllVotes',
        ),

      getVoteStateForResponse: (messageId, modelResponseId) => {
        const vote = get().votes.get(messageId);
        if (!vote) return 'none';

        const result = vote.results.find((r) => r.modelResponseId === modelResponseId);
        return result?.outcome ?? 'none';
      },

      getHoverStateForResponse: (messageId, modelResponseId, participantIds) => {
        const { hoveredVote } = get();
        if (!hoveredVote || hoveredVote.messageId !== messageId) {
          return null;
        }

        if (!participantIds.includes(modelResponseId)) {
          return null;
        }

        if (hoveredVote.voteType === 'winner') {
          return modelResponseId === hoveredVote.winnerId ? 'winner' : 'loser';
        }

        if (hoveredVote.voteType === 'tie') {
          return 'tie';
        }

        if (hoveredVote.voteType === 'all_bad') {
          return 'all_bad';
        }

        return null;
      },
    }),
    { name: 'vote-store', enabled: process.env.NODE_ENV === 'development' },
  ),
);

/**
 * Selectors for accessing vote store state
 */
export const voteSelectors = {
  votes: (state: VoteStore) => state.votes,
  hoveredVote: (state: VoteStore) => state.hoveredVote,
  isSubmitting: (state: VoteStore) => state.isSubmitting,
  isLoading: (messageId: string) => (state: VoteStore) =>
    state.loadingStates.get(messageId) ?? false,

  voteState: (state: VoteStore) => ({
    hoveredVote: state.hoveredVote,
    isSubmitting: state.isSubmitting,
  }),

  voteActions: (state: VoteStore) => ({
    getVote: state.getVote,
    setHoveredVote: state.setHoveredVote,
    submitVote: state.submitVote,
    loadVoteForMessage: state.loadVoteForMessage,
    clearAllVotes: state.clearAllVotes,
  }),
};
