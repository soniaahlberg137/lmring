import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/settings/api-keys/check/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

const { mockAuthInstance, mockStreamText } = vi.hoisted(() => {
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
    mockStreamText: vi.fn(),
  };
});

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@lmring/ai-hub', () => ({
  streamText: mockStreamText,
  generateText: vi.fn(),
  ProviderBuilder: {
    openai: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    anthropic: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    deepseek: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    mistral: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    xai: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    openrouter: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
    compatible: vi.fn().mockReturnValue({
      languageModel: vi.fn().mockReturnValue({}),
    }),
  },
}));

setupTestEnvironment();

describe('API Keys Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/settings/api-keys/check', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'gpt-4o',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: '',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return success when connection succeeds', async () => {
      mockStreamText.mockReturnValue({
        text: Promise.resolve('Hello!'),
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'gpt-4o',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Connection successful');
      expect(data.responseTimeMs).toBeDefined();
    });

    it('should return error for invalid API key', async () => {
      mockStreamText.mockImplementation(() => {
        throw new Error('401 Unauthorized');
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'invalid-key',
          model: 'gpt-4o',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_API_KEY');
    });

    it('should return error for model not found', async () => {
      mockStreamText.mockImplementation(() => {
        throw new Error('404 Not Found');
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'nonexistent-model',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('MODEL_NOT_FOUND');
    });

    it('should return error for rate limiting', async () => {
      mockStreamText.mockImplementation(() => {
        throw new Error('429 Rate limit exceeded');
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'gpt-4o',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('RATE_LIMITED');
    });

    it('should return error for network issues', async () => {
      mockStreamText.mockImplementation(() => {
        throw new Error('ENOTFOUND api.openai.com');
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'gpt-4o',
          proxyUrl: 'https://invalid-proxy.example.com',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NETWORK_ERROR');
    });

    it('should support custom proxy URL', async () => {
      mockStreamText.mockReturnValue({
        text: Promise.resolve('Hello!'),
      });

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/check',
        {
          providerName: 'openai',
          apiKey: 'sk-test123',
          model: 'gpt-4o',
          proxyUrl: 'https://custom-proxy.example.com',
        },
      );

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
