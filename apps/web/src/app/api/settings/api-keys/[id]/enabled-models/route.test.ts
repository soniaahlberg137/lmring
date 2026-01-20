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
      limit: vi.fn().mockReturnThis(),
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
  and: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
  },
  userEnabledModels: {
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    enabled: 'enabled',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Enabled Models API', () => {
  const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockApiKey = {
    id: validUUID,
    userId: 'test-user-id',
    providerName: 'openai',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/[id]/enabled-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/invalid-id/enabled-models',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 404 when API key is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return empty models array when no enabled models', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual([]);
    });

    it('should return enabled models successfully', async () => {
      const mockEnabledModels = [
        { modelId: 'gpt-4', enabled: true },
        { modelId: 'gpt-3.5-turbo', enabled: false },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockEnabledModels);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual(mockEnabledModels);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
