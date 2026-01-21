import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useConversation } from './use-conversation';

describe('useConversation', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConversation', () => {
    it('creates a conversation successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-1',
        title: 'Test Title',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: mockConversation }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversation: unknown;
      await act(async () => {
        conversation = await result.current.createConversation('Test Title');
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Title' }),
      });
      expect(conversation).toEqual(mockConversation);
      expect(result.current.error).toBeNull();
    });

    it('handles creation error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Creation failed' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversation: unknown;
      await act(async () => {
        conversation = await result.current.createConversation('Test');
      });

      expect(conversation).toBeNull();
      expect(result.current.error).toBe('Creation failed');
    });

    it('handles network error', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useConversation());

      let conversation: unknown;
      await act(async () => {
        conversation = await result.current.createConversation('Test');
      });

      expect(conversation).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('saveMessage', () => {
    it('saves a message successfully', async () => {
      const mockMessage = {
        id: 'msg-123',
        role: 'user' as const,
        content: 'Hello',
        createdAt: '2025-01-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: mockMessage }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let message: unknown;
      await act(async () => {
        message = await result.current.saveMessage('conv-123', 'user', 'Hello');
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations/conv-123/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'Hello', attachments: undefined }),
      });
      expect(message).toEqual(mockMessage);
    });

    it('saves a message with attachments', async () => {
      const mockMessage = {
        id: 'msg-123',
        role: 'user' as const,
        content: 'Hello',
        attachments: [{ type: 'image', fileId: 'file-1', mimeType: 'image/png' }],
        createdAt: '2025-01-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: mockMessage }),
      } as Response);

      const { result } = renderHook(() => useConversation());
      const attachments = [{ type: 'image' as const, fileId: 'file-1', mimeType: 'image/png' }];

      let message: unknown;
      await act(async () => {
        message = await result.current.saveMessage('conv-123', 'user', 'Hello', attachments);
      });

      expect(message).toEqual(mockMessage);
    });

    it('handles save message error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to save message' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let message: unknown;
      await act(async () => {
        message = await result.current.saveMessage('conv-123', 'user', 'Hello');
      });

      expect(message).toBeNull();
      expect(result.current.error).toBe('Failed to save message');
    });
  });

  describe('saveModelResponse', () => {
    it('saves a model response successfully', async () => {
      const mockResponse = {
        id: 'resp-123',
        modelName: 'gpt-4',
        providerName: 'openai',
        responseContent: 'Hello back!',
        createdAt: '2025-01-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: mockResponse }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let response: unknown;
      await act(async () => {
        response = await result.current.saveModelResponse(
          'msg-123',
          'gpt-4',
          'openai',
          'Hello back!',
          100,
          250,
          1,
        );
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/model-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: 'msg-123',
          modelName: 'gpt-4',
          providerName: 'openai',
          responseContent: 'Hello back!',
          tokensUsed: 100,
          responseTimeMs: 250,
          displayPosition: 1,
          attachments: undefined,
        }),
      });
      expect(response).toEqual(mockResponse);
    });

    it('handles save model response error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to save response' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let response: unknown;
      await act(async () => {
        response = await result.current.saveModelResponse('msg-123', 'gpt-4', 'openai', 'Hello');
      });

      expect(response).toBeNull();
      expect(result.current.error).toBe('Failed to save response');
    });
  });

  describe('loadConversation', () => {
    it('loads a conversation successfully', async () => {
      const mockData = {
        conversation: {
          id: 'conv-123',
          userId: 'user-1',
          title: 'Test',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        messages: [{ id: 'msg-1', role: 'user', content: 'Hi', createdAt: '2025-01-01T00:00:00Z' }],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const { result } = renderHook(() => useConversation());

      let data: unknown;
      await act(async () => {
        data = await result.current.loadConversation('conv-123');
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations/conv-123/full');
      expect(data).toEqual(mockData);
    });

    it('handles load conversation error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let data: unknown;
      await act(async () => {
        data = await result.current.loadConversation('conv-123');
      });

      expect(data).toBeNull();
      expect(result.current.error).toBe('Not found');
    });
  });

  describe('getRecentConversations', () => {
    it('gets recent conversations successfully', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'Conversation 1' },
        { id: 'conv-2', title: 'Conversation 2' },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversations: unknown;
      await act(async () => {
        conversations = await result.current.getRecentConversations(5);
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations?limit=5&withFirstMessage=true');
      expect(conversations).toEqual(mockConversations);
    });

    it('uses default limit of 10', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      await act(async () => {
        await result.current.getRecentConversations();
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations?limit=10&withFirstMessage=true');
    });

    it('returns empty array on error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversations: unknown;
      await act(async () => {
        conversations = await result.current.getRecentConversations();
      });

      expect(conversations).toEqual([]);
      expect(result.current.error).toBe('Failed');
    });
  });

  describe('getConversationsWithModels', () => {
    it('gets conversations with models successfully', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'Conv 1', models: [{ modelName: 'gpt-4', providerName: 'openai' }] },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversations: unknown;
      await act(async () => {
        conversations = await result.current.getConversationsWithModels(20, 10);
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/conversations?limit=20&offset=10&withFirstMessage=true&withModels=true&withVotes=true',
      );
      expect(conversations).toEqual(mockConversations);
    });

    it('returns empty array on error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversations: unknown;
      await act(async () => {
        conversations = await result.current.getConversationsWithModels();
      });

      expect(conversations).toEqual([]);
    });
  });

  describe('shareConversation', () => {
    it('shares a conversation successfully', async () => {
      const mockResult = {
        shareToken: 'token-123',
        shareUrl: 'https://example.com/share/token-123',
        expiresAt: '2025-02-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const { result } = renderHook(() => useConversation());

      let shareResult: unknown;
      await act(async () => {
        shareResult = await result.current.shareConversation('conv-123', 7);
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations/conv-123/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 7 }),
      });
      expect(shareResult).toEqual(mockResult);
    });

    it('handles share error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot share' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let shareResult: unknown;
      await act(async () => {
        shareResult = await result.current.shareConversation('conv-123');
      });

      expect(shareResult).toBeNull();
      expect(result.current.error).toBe('Cannot share');
    });
  });

  describe('deleteConversation', () => {
    it('deletes a conversation successfully', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteConversation('conv-123');
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations/conv-123', {
        method: 'DELETE',
      });
      expect(success).toBe(true);
    });

    it('handles delete error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteConversation('conv-123');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Cannot delete');
    });
  });

  describe('updateConversationTitle', () => {
    it('updates conversation title successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        title: 'New Title',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: mockConversation }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversation: unknown;
      await act(async () => {
        conversation = await result.current.updateConversationTitle('conv-123', 'New Title');
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/conversations/conv-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });
      expect(conversation).toEqual(mockConversation);
    });

    it('handles update error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      let conversation: unknown;
      await act(async () => {
        conversation = await result.current.updateConversationTitle('conv-123', 'New Title');
      });

      expect(conversation).toBeNull();
      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('loading state', () => {
    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useConversation());
      expect(result.current.isLoading).toBe(false);
    });

    it('resets isLoading after operation completes', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: { id: '1' } }),
      } as Response);

      const { result } = renderHook(() => useConversation());

      await act(async () => {
        await result.current.createConversation('Test');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling for unknown errors', () => {
    it('handles non-Error objects in catch', async () => {
      fetchSpy.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useConversation());

      await act(async () => {
        await result.current.createConversation('Test');
      });

      expect(result.current.error).toBe('Unknown error');
    });
  });
});
