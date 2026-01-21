import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { GET } from './route';

const { mockDbInstance, mockAuthInstance } = vi.hoisted(() => {
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
    mockDbInstance: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    },
    mockAuthInstance: {
      api: {
        getSession: vi.fn().mockResolvedValue(mockSession),
      },
    },
  };
});

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
    providerName: 'providerName',
  },
  userModelOverrides: {
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    displayName: 'displayName',
    groupName: 'groupName',
    abilities: 'abilities',
    supportsStreaming: 'supportsStreaming',
    priceCurrency: 'priceCurrency',
    inputPrice: 'inputPrice',
    outputPrice: 'outputPrice',
    userId: 'userId',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('All Model Overrides API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/all/model-overrides', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return empty object when no API keys exist', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.overrides).toEqual({});
    });

    it('should return model overrides grouped by API key ID', async () => {
      const mockApiKeys = [
        { id: 'key-1', providerName: 'openai' },
        { id: 'key-2', providerName: 'anthropic' },
      ];
      const mockOverrides = [
        { apiKeyId: 'key-1', modelId: 'gpt-4', displayName: 'Custom GPT-4' },
        { apiKeyId: 'key-1', modelId: 'gpt-3.5-turbo', displayName: 'Custom GPT-3.5' },
        { apiKeyId: 'key-2', modelId: 'claude-3', displayName: 'Custom Claude' },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockApiKeys);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockOverrides);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(Object.keys(data.overrides)).toHaveLength(2);
      expect(data.overrides['key-1']).toHaveLength(2);
      expect(data.overrides['key-2']).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
