import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, setupTestEnvironment } from '@/test/helpers';
import { POST } from './route';

const {
  mockAuthInstance,
  mockFetchUserApiKeys,
  mockStreamText,
  mockCreateProvider,
  mockGetModel,
  mockDetectReasoningByModelId,
} = vi.hoisted(() => {
  const mockSession = {
    session: {
      id: 'test-session-id',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: 'test-token',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return {
    mockAuthInstance: {
      api: {
        getSession: vi.fn().mockResolvedValue(mockSession),
      },
    },
    mockFetchUserApiKeys: vi.fn(),
    mockStreamText: vi.fn(),
    mockCreateProvider: vi.fn(),
    mockGetModel: vi.fn().mockReturnValue({ abilities: { reasoning: false } }),
    mockDetectReasoningByModelId: vi.fn().mockReturnValue(false),
  };
});

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@/libs/provider-factory', () => ({
  fetchUserApiKeys: mockFetchUserApiKeys,
  createProvider: mockCreateProvider,
}));

vi.mock('@lmring/ai-hub', () => ({
  streamText: mockStreamText,
}));

vi.mock('@lmring/model-depot', () => ({
  getModel: mockGetModel,
  detectReasoningByModelId: mockDetectReasoningByModelId,
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Workflow Stream API', () => {
  const validUUID = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default behavior
    mockGetModel.mockReturnValue({ abilities: { reasoning: false } });
    mockDetectReasoningByModelId.mockReturnValue(false);
  });

  describe('POST /api/workflow/stream', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when workflowId is invalid', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: 'invalid-uuid',
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when keyId is invalid', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: 'invalid-uuid',
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when modelId is empty', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: '',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when messages array is empty', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when message role is invalid', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'invalid', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when message content is empty', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: '' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when temperature is out of range', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 5.0, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 403 when API key is not found', async () => {
      mockFetchUserApiKeys.mockResolvedValueOnce(new Map());

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('API key not found or not authorized');
    });

    it('should return SSE stream response on success', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Hello' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 10,
          inputTokens: 5,
          outputTokens: 5,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });

    it('should handle database errors gracefully', async () => {
      mockFetchUserApiKeys.mockRejectedValueOnce(new Error('Database error'));

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle attachments in the last user message', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'I see your image' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 15,
          inputTokens: 10,
          outputTokens: 5,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4o',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'What is in this image?' }],
        config: { temperature: 0.7, maxTokens: 1000 },
        attachments: [
          { type: 'image', data: 'data:image/png;base64,abc123', mediaType: 'image/png' },
        ],
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(mockStreamText).toHaveBeenCalled();
      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.messages[0].content).toEqual([
        { type: 'image', image: 'data:image/png;base64,abc123' },
        { type: 'text', text: 'What is in this image?' },
      ]);
    });

    it('should handle reasoning-delta events in stream', async () => {
      const mockKeyData = {
        providerName: 'anthropic',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'reasoning-delta', text: 'Let me think...' };
        yield { type: 'text-delta', text: 'The answer is 42' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 20,
          inputTokens: 5,
          outputTokens: 15,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'claude-3-5-sonnet',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'What is the meaning of life?' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const chunks: string[] = [];
      let done = false;
      while (!done) {
        const result = await reader?.read();
        if (result?.done) {
          done = true;
        } else if (result?.value) {
          chunks.push(decoder.decode(result.value));
        }
      }

      const allData = chunks.join('');
      expect(allData).toContain('"type":"reasoning"');
      expect(allData).toContain('"reasoning":"Let me think..."');
    });

    it('should handle stream errors and send error event', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Hello' };
        throw new Error('Connection lost');
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 10,
          inputTokens: 5,
          outputTokens: 5,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const chunks: string[] = [];
      let done = false;
      while (!done) {
        const result = await reader?.read();
        if (result?.done) {
          done = true;
        } else if (result?.value) {
          chunks.push(decoder.decode(result.value));
        }
      }

      const allData = chunks.join('');
      expect(allData).toContain('"type":"error"');
      expect(allData).toContain('"error":"Connection lost"');
    });

    it('should use providerType for custom providers', async () => {
      const mockKeyData = {
        providerName: 'custom-provider',
        apiKey: 'sk-custom123',
        proxyUrl: 'https://custom.api.com',
        isCustom: true,
        providerType: 'anthropic',
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockDetectReasoningByModelId.mockReturnValueOnce(true);

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 10,
          inputTokens: 5,
          outputTokens: 5,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'custom-model',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockCreateProvider).toHaveBeenCalledWith(
        'anthropic',
        'sk-custom123',
        'https://custom.api.com',
      );
      expect(mockDetectReasoningByModelId).toHaveBeenCalledWith('custom-model');
    });

    it('should apply openai reasoning options for openai provider', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'o1-preview',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toEqual({ openai: { reasoningSummary: 'auto' } });
      expect(callArgs?.temperature).toBeUndefined();
    });

    it('should apply google reasoning options for google provider', async () => {
      const mockKeyData = {
        providerName: 'google',
        apiKey: 'google-key',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gemini-2.0-flash-thinking',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toEqual({
        google: { thinkingConfig: { includeThoughts: true } },
      });
    });

    it('should skip maxTokens when proxyUrl is set', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: 'https://proxy.example.com',
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.maxOutputTokens).toBeUndefined();
    });

    it('should include optional params when provided and not reasoning model', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: false } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.temperature).toBe(0.7);
      expect(callArgs?.topP).toBe(0.9);
      expect(callArgs?.frequencyPenalty).toBe(0.5);
      expect(callArgs?.presencePenalty).toBe(0.3);
      expect(callArgs?.maxOutputTokens).toBe(1000);
    });

    it('should handle custom provider without providerType (defaults to openai)', async () => {
      const mockKeyData = {
        providerName: 'custom-provider',
        apiKey: 'sk-custom123',
        proxyUrl: 'https://custom.api.com',
        isCustom: true,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockDetectReasoningByModelId.mockReturnValueOnce(true);

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'o1-mini',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toEqual({ openai: { reasoningSummary: 'auto' } });
    });

    it('should handle azure provider with reasoning options', async () => {
      const mockKeyData = {
        providerName: 'azure',
        apiKey: 'azure-key',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'o1',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toEqual({ openai: { reasoningSummary: 'auto' } });
    });

    it('should handle gemini provider alias with reasoning options', async () => {
      const mockKeyData = {
        providerName: 'gemini',
        apiKey: 'gemini-key',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gemini-thinking',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toEqual({
        google: { thinkingConfig: { includeThoughts: true } },
      });
    });

    it('should handle deepseek/xai reasoning models without special options', async () => {
      const mockKeyData = {
        providerName: 'deepseek',
        apiKey: 'deepseek-key',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });
      mockGetModel.mockReturnValueOnce({ abilities: { reasoning: true } });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'deepseek-reasoner',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.providerOptions).toBeUndefined();
      expect(callArgs?.temperature).toBeUndefined();
    });

    it('should handle multiple messages with assistant role', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Response' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({ totalTokens: 10, inputTokens: 5, outputTokens: 5 }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      await POST(request);

      const callArgs = mockStreamText.mock.calls[0]?.[0];
      expect(callArgs?.messages).toHaveLength(3);
      expect(callArgs?.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(callArgs?.messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
      expect(callArgs?.messages[2]).toEqual({ role: 'user', content: 'How are you?' });
    });

    it('should read complete stream with ttft, chunks, and complete events', async () => {
      const mockKeyData = {
        providerName: 'openai',
        apiKey: 'sk-test123',
        proxyUrl: null,
        isCustom: false,
        providerType: null,
      };

      mockFetchUserApiKeys.mockResolvedValueOnce(new Map([[validUUID, mockKeyData]]));
      mockCreateProvider.mockReturnValue({
        languageModel: vi.fn().mockReturnValue({}),
      });

      const mockFullStream = (async function* () {
        yield { type: 'text-delta', text: 'Hello ' };
        yield { type: 'text-delta', text: 'World!' };
      })();

      mockStreamText.mockReturnValue({
        fullStream: mockFullStream,
        usage: Promise.resolve({
          totalTokens: 10,
          inputTokens: 5,
          outputTokens: 5,
        }),
      });

      const request = createMockRequest('POST', 'http://localhost:3000/api/workflow/stream', {
        workflowId: validUUID,
        modelId: 'gpt-4',
        keyId: validUUID,
        messages: [{ role: 'user', content: 'Hello' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      });
      const response = await POST(request);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const chunks: string[] = [];
      let done = false;
      while (!done) {
        const result = await reader?.read();
        if (result?.done) {
          done = true;
        } else if (result?.value) {
          chunks.push(decoder.decode(result.value));
        }
      }

      const allData = chunks.join('');
      expect(allData).toContain('"type":"ttft"');
      expect(allData).toContain('"type":"chunk"');
      expect(allData).toContain('"chunk":"Hello "');
      expect(allData).toContain('"chunk":"World!"');
      expect(allData).toContain('"type":"complete"');
      expect(allData).toContain('[DONE]');
    });
  });
});
