import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { GET, PUT } from './route';

const {
  mockDbInstance,
  mockAuthInstance,
  mockDecryptFn,
  mockFetchAvailableModels,
  mockGetDefaultProviderUrl,
  mockGetProviderById,
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
    mockDbInstance: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    },
    mockAuthInstance: {
      api: {
        getSession: vi.fn().mockResolvedValue(mockSession),
      },
    },
    mockDecryptFn: vi.fn((encrypted: string) => encrypted.replace('encrypted_', '')),
    mockFetchAvailableModels: vi.fn(),
    mockGetDefaultProviderUrl: vi.fn(),
    mockGetProviderById: vi.fn(),
  };
});

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
  and: vi.fn(),
  decrypt: mockDecryptFn,
}));

vi.mock('@lmring/database/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
    providerName: 'providerName',
    encryptedKey: 'encryptedKey',
    proxyUrl: 'proxyUrl',
  },
  userEnabledModels: {
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    enabled: 'enabled',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

vi.mock('@lmring/ai-hub', () => ({
  fetchAvailableModels: mockFetchAvailableModels,
  getDefaultProviderUrl: mockGetDefaultProviderUrl,
  getProviderById: mockGetProviderById,
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Models API', () => {
  const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockApiKey = {
    id: validUUID,
    userId: 'test-user-id',
    providerName: 'openai',
    encryptedKey: 'encrypted_sk-test123',
    proxyUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDefaultProviderUrl.mockReturnValue('https://api.openai.com/v1');
    mockGetProviderById.mockReturnValue({ name: 'OpenAI', id: 'openai' });
    mockFetchAvailableModels.mockResolvedValue({
      models: [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ],
      source: 'api',
    });
  });

  describe('GET /api/settings/api-keys/[id]/models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/invalid-id/models',
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
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return 400 when encrypted key is missing', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([{ ...mockApiKey, encryptedKey: null }]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('NO_API_KEY');
    });

    it('should return models successfully', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce([{ modelId: 'gpt-4', enabled: true }]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.providerId).toBe('openai');
      expect(data.providerName).toBe('OpenAI');
      expect(data.models).toHaveLength(2);
      expect(mockDecryptFn).toHaveBeenCalledWith('encrypted_sk-test123');
    });

    it('should handle invalid API key error from provider', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockFetchAvailableModels.mockRejectedValueOnce(new Error('401 Unauthorized'));

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('INVALID_API_KEY');
    });
  });

  describe('PUT /api/settings/api-keys/[id]/models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
        { models: [{ modelId: 'gpt-4', enabled: true }] },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/settings/api-keys/invalid-id/models',
        { models: [{ modelId: 'gpt-4', enabled: true }] },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
        { models: [] },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 404 when API key is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
        { models: [{ modelId: 'gpt-4', enabled: true }] },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should update model settings successfully', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.onConflictDoUpdate.mockResolvedValue(undefined);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
        {
          models: [
            { modelId: 'gpt-4', enabled: true },
            { modelId: 'gpt-3.5-turbo', enabled: false },
          ],
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe('Model settings updated successfully');
      expect(data.modelsUpdated).toBe(2);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/models`,
        { models: [{ modelId: 'gpt-4', enabled: true }] },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
