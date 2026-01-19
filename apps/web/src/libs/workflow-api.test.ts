import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowMetrics, WorkflowStreamEvent } from '@/types/workflow';
import { buildWorkflowStreamRequest, parseWorkflowMetrics, streamWorkflow } from './workflow-api';

describe('workflow-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildWorkflowStreamRequest', () => {
    it('should build basic request without attachments', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'gpt-4',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7, maxTokens: 2048 },
      );

      expect(result).toEqual({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });
    });

    it('should build request with attachments', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'gpt-4',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7, maxTokens: 2048 },
        [{ type: 'image', data: 'base64data', mediaType: 'image/png' }],
      );

      expect(result).toEqual({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
        attachments: [{ type: 'image', data: 'base64data', mediaType: 'image/png' }],
      });
    });

    it('should not include attachments if empty array', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'gpt-4',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7, maxTokens: 2048 },
        [],
      );

      expect(result.attachments).toBeUndefined();
    });

    it('should split modelId with colon correctly', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'provider:gpt-4',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7, maxTokens: 2048 },
      );

      expect(result.modelId).toBe('gpt-4');
    });

    it('should handle modelId with multiple colons', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'provider:namespace:model-name',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7, maxTokens: 2048 },
      );

      expect(result.modelId).toBe('namespace:model-name');
    });

    it('should include optional config fields', () => {
      const result = buildWorkflowStreamRequest(
        'workflow-123',
        'gpt-4',
        'key-456',
        [{ role: 'user', content: 'Hello' }],
        {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      );

      expect(result.config).toEqual({
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
      });
    });
  });

  describe('parseWorkflowMetrics', () => {
    it('should return metrics from complete event', () => {
      const metrics: WorkflowMetrics = {
        totalTime: 1000,
        timeToFirstToken: 100,
        tokensPerSecond: 50,
      };
      const event: WorkflowStreamEvent = {
        type: 'complete',
        workflowId: 'workflow-123',
        metrics,
      };

      expect(parseWorkflowMetrics(event)).toEqual(metrics);
    });

    it('should return undefined for complete event without metrics', () => {
      const event: WorkflowStreamEvent = {
        type: 'complete',
        workflowId: 'workflow-123',
      };

      expect(parseWorkflowMetrics(event)).toBeUndefined();
    });

    it('should return undefined for non-complete event', () => {
      const event: WorkflowStreamEvent = {
        type: 'chunk',
        workflowId: 'workflow-123',
        chunk: 'Hello',
      };

      expect(parseWorkflowMetrics(event)).toBeUndefined();
    });

    it('should return undefined for error event', () => {
      const event: WorkflowStreamEvent = {
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Something went wrong',
      };

      expect(parseWorkflowMetrics(event)).toBeUndefined();
    });
  });

  describe('streamWorkflow', () => {
    beforeEach(() => {
      vi.stubGlobal('console', {
        ...console,
        error: vi.fn(),
      });
    });

    it('should yield error event when response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad request' }),
      } as Response);

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Bad request',
      });
    });

    it('should yield error with combined message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Main error', message: 'Additional details' }),
      } as Response);

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Main error\nAdditional details',
      });
    });

    it('should handle error object with message property', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Nested error message' } }),
      } as Response);

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Nested error message',
      });
    });

    it('should yield error when no response body', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response);

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Response body is not readable',
      });
    });

    it('should stream SSE events', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"chunk","workflowId":"workflow-123","chunk":"Hello"}\n',
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"chunk","workflowId":"workflow-123","chunk":" World"}\n',
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

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'chunk', workflowId: 'workflow-123', chunk: 'Hello' });
      expect(events[1]).toEqual({ type: 'chunk', workflowId: 'workflow-123', chunk: ' World' });
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle SSE parsing errors gracefully', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: invalid json\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"type":"chunk","workflowId":"workflow-123","chunk":"Valid"}\n',
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

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]?.chunk).toBe('Valid');
    });

    it('should handle buffered lines across chunks', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"chunk","workflowId":"workflow-123"'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(',"chunk":"Hello"}\n'),
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

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const events: WorkflowStreamEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', workflowId: 'workflow-123', chunk: 'Hello' });
    });

    it('should pass abort signal to fetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response);

      const controller = new AbortController();
      const generator = streamWorkflow(
        {
          workflowId: 'workflow-123',
          modelId: 'gpt-4',
          keyId: 'key-456',
          messages: [{ role: 'user', content: 'Hello' }],
          config: { temperature: 0.7, maxTokens: 2048 },
        },
        controller.signal,
      );

      await generator.next();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/workflow/stream',
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
    });

    it('should handle JSON parse failure gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      } as Response);

      const generator = streamWorkflow({
        workflowId: 'workflow-123',
        modelId: 'gpt-4',
        keyId: 'key-456',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 2048 },
      });

      const result = await generator.next();
      expect(result.value).toEqual({
        type: 'error',
        workflowId: 'workflow-123',
        error: 'Failed to stream workflow',
      });
    });
  });
});
