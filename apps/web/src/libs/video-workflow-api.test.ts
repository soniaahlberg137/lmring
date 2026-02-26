import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowStreamEvent } from '@/types/workflow';
import { buildVideoStreamRequest, streamVideoWorkflow } from './video-workflow-api';

describe('video-workflow-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildVideoStreamRequest', () => {
    it('should build basic request with all parameters', () => {
      const result = buildVideoStreamRequest('video-123', 'gpt-4', 'key-456', 'Test prompt');

      expect(result).toEqual({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test prompt',
      });
    });

    it('should extract model name when modelId contains prefix with colon', () => {
      const result = buildVideoStreamRequest(
        'video-123',
        'provider:gpt-4',
        'key-456',
        'Test prompt',
      );

      expect(result.modelId).toBe('gpt-4');
    });

    it('should handle modelId with multiple colons correctly', () => {
      const result = buildVideoStreamRequest(
        'video-123',
        'provider:namespace:model-name',
        'key-456',
        'Test prompt',
      );

      expect(result.modelId).toBe('namespace:model-name');
    });

    it('should keep modelId unchanged when no colon present', () => {
      const result = buildVideoStreamRequest('video-123', 'claude-opus', 'key-456', 'Test prompt');

      expect(result.modelId).toBe('claude-opus');
    });

    it('should handle empty string prompt', () => {
      const result = buildVideoStreamRequest('video-123', 'gpt-4', 'key-456', '');

      expect(result.prompt).toBe('');
    });

    it('should preserve workflowId and keyId as-is', () => {
      const result = buildVideoStreamRequest(
        'workflow-with-prefix:id',
        'model',
        'key:with:colons',
        'prompt',
      );

      expect(result.workflowId).toBe('workflow-with-prefix:id');
      expect(result.keyId).toBe('key:with:colons');
    });
  });

  describe('streamVideoWorkflow', () => {
    it('should yield error event when response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'video-123',
        error: 'Unauthorized',
      });
    });

    it('should yield error with fallback message when error parsing fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'video-123',
        error: 'Failed to stream video workflow',
      });
    });

    it('should yield error when response body is not readable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'video-123',
        error: 'Response body is not readable',
      });
    });

    it('should stream SSE events successfully', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'chunk', workflowId: 'video-123', chunk: 'Hello' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'chunk', workflowId: 'video-123', chunk: ' World' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'chunk', workflowId: 'video-123', chunk: 'Hello' });
      expect(events[1]).toEqual({ type: 'chunk', workflowId: 'video-123', chunk: ' World' });
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle different WorkflowStreamEvent types', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'chunk', workflowId: 'video-123', chunk: 'text' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({
                  type: 'complete',
                  workflowId: 'video-123',
                  metrics: { totalTime: 1000, timeToFirstToken: 100, tokensPerSecond: 50 },
                }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'error', workflowId: 'video-123', error: 'Stream error' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0]?.type).toBe('chunk');
      expect(events[1]?.type).toBe('complete');
      expect(events[2]?.type).toBe('error');
    });

    it('should handle SSE parsing with DONE signal', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'chunk', workflowId: 'video-123', chunk: 'content' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]?.chunk).toBe('content');
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle invalid JSON in SSE events gracefully', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: invalid json data\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: ' +
                JSON.stringify({ type: 'chunk', workflowId: 'video-123', chunk: 'Valid' }) +
                '\n',
            ),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]?.chunk).toBe('Valid');
    });

    it('should handle buffered lines across multiple chunks', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"chunk","workflowId":"video-123"'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(',"chunk":"Buffered"}\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]?.chunk).toBe('Buffered');
    });

    it('should pass abort signal to fetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response);

      const controller = new AbortController();
      const generator = streamVideoWorkflow(
        {
          workflowId: 'video-123',
          modelId: 'gpt-4',
          keyId: 'key-456',
          prompt: 'Test',
        },
        controller.signal,
      );

      await generator.next();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/workflow/video-stream',
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
    });

    it('should send correct request body to endpoint', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test prompt',
      });

      await generator.next();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/workflow/video-stream',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: 'video-123',
            modelId: 'gpt-4',
            keyId: 'key-456',
            prompt: 'Test prompt',
          }),
        }),
      );
    });

    it('should release reader lock after stream completion', async () => {
      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      for await (const _event of generator) {
        // Iterate through events
      }

      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should release reader lock on error in stream', async () => {
      const mockReader = {
        read: vi.fn().mockRejectedValueOnce(new Error('Stream error')),
        releaseLock: vi.fn(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      try {
        for await (const _event of generator) {
          // Try to iterate
        }
      } catch {
        // Error expected
      }

      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle error object with message property', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Nested error message' } }),
      } as unknown as Response);

      const generator = streamVideoWorkflow({
        workflowId: 'video-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        prompt: 'Test',
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'video-123',
        error: 'Nested error message',
      });
    });
  });
});
