'use client';

import { useCallback, useState } from 'react';
import type { VoteInfoExtended } from '@/types/vote';

export type { VoteInfoExtended as VoteInfo, VoteResult } from '@/types/vote';

/**
 * Types for conversation management
 */
export interface ConversationModel {
  modelName: string;
  providerName: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  responses?: ModelResponseData[];
}

export interface ModelResponseData {
  id: string;
  modelName: string;
  providerName: string;
  responseContent: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  displayPosition?: number;
  createdAt: string;
}

export interface ConversationData {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  firstMessage?: string;
  models?: ConversationModel[];
  voteInfo?: VoteInfoExtended;
}

export interface FullConversationData {
  conversation: ConversationData;
  messages: ConversationMessage[];
}

/**
 * Hook for managing conversation CRUD operations
 */
export function useConversation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (title: string): Promise<ConversationData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create conversation');
        }

        const data = await response.json();
        return data.conversation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Save a user message to a conversation
   */
  const saveMessage = useCallback(
    async (
      conversationId: string,
      role: 'user' | 'assistant' | 'system',
      content: string,
    ): Promise<ConversationMessage | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, content }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save message');
        }

        const data = await response.json();
        return data.message;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Save a model response
   */
  const saveModelResponse = useCallback(
    async (
      messageId: string,
      modelName: string,
      providerName: string,
      responseContent: string,
      tokensUsed?: number,
      responseTimeMs?: number,
      displayPosition?: number,
    ): Promise<ModelResponseData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/model-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            modelName,
            providerName,
            responseContent,
            tokensUsed,
            responseTimeMs,
            displayPosition,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save model response');
        }

        const data = await response.json();
        return data.response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Load a conversation with full messages and responses
   */
  const loadConversation = useCallback(
    async (conversationId: string): Promise<FullConversationData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/full`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load conversation');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get recent conversations for sidebar
   */
  const getRecentConversations = useCallback(async (limit = 10): Promise<ConversationData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations?limit=${limit}&withFirstMessage=true`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get conversations');
      }

      const data = await response.json();
      return data.conversations;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get conversations with model info for history page
   */
  const getConversationsWithModels = useCallback(
    async (limit = 50, offset = 0): Promise<ConversationData[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/conversations?limit=${limit}&offset=${offset}&withFirstMessage=true&withModels=true&withVotes=true`,
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get conversations');
        }

        const data = await response.json();
        return data.conversations;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Share a conversation
   */
  const shareConversation = useCallback(
    async (
      conversationId: string,
      expiresInDays?: number,
    ): Promise<{ shareToken: string; shareUrl: string; expiresAt?: string } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresInDays }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to share conversation');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete conversation');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update conversation title
   */
  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string): Promise<ConversationData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update conversation');
        }

        const data = await response.json();
        return data.conversation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    createConversation,
    saveMessage,
    saveModelResponse,
    loadConversation,
    getRecentConversations,
    getConversationsWithModels,
    shareConversation,
    deleteConversation,
    updateConversationTitle,
  };
}
