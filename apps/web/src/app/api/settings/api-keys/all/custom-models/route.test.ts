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
  userCustomModels: {
    apiKeyId: 'apiKeyId',
    id: 'id',
    modelId: 'modelId',
    displayName: 'displayName',
    createdAt: 'createdAt',
    userId: 'userId',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('All Custom Models API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/all/custom-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
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
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual({});
    });

    it('should return custom models grouped by API key ID', async () => {
      const mockApiKeys = [
        { id: 'key-1', providerName: 'openai' },
        { id: 'key-2', providerName: 'anthropic' },
      ];
      const mockCustomModels = [
        { apiKeyId: 'key-1', id: 'cm-1', modelId: 'custom-1', displayName: 'Custom 1' },
        { apiKeyId: 'key-1', id: 'cm-2', modelId: 'custom-2', displayName: 'Custom 2' },
        { apiKeyId: 'key-2', id: 'cm-3', modelId: 'custom-3', displayName: 'Custom 3' },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockApiKeys);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockCustomModels);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(Object.keys(data.models)).toHaveLength(2);
      expect(data.models['key-1']).toHaveLength(2);
      expect(data.models['key-2']).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
