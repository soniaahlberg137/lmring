import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { DELETE, PUT } from './route';

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
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
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
  userModelOverrides: {
    id: 'id',
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    displayName: 'displayName',
    groupName: 'groupName',
    abilities: 'abilities',
    supportsStreaming: 'supportsStreaming',
    priceCurrency: 'priceCurrency',
    inputPrice: 'inputPrice',
    outputPrice: 'outputPrice',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Model Overrides [modelId] API', () => {
  const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockApiKey = {
    id: validUUID,
    userId: 'test-user-id',
    providerName: 'openai',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/settings/api-keys/[id]/model-overrides/[modelId]', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
        { displayName: 'Updated GPT-4' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/settings/api-keys/invalid-id/model-overrides/gpt-4',
        { displayName: 'Updated GPT-4' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'invalid-id', modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 400 when modelId is invalid', async () => {
      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/`,
        { displayName: 'Updated Model' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUUID, modelId: '' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_MODEL_ID');
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
        { inputPrice: -1 },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
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
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
        { displayName: 'Updated GPT-4' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should update model override successfully (upsert)', async () => {
      const updatedOverride = {
        id: 'mo-1',
        modelId: 'gpt-4',
        displayName: 'Updated GPT-4',
        groupName: null,
        abilities: null,
        supportsStreaming: null,
        priceCurrency: null,
        inputPrice: null,
        outputPrice: null,
      };

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.insert.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.values.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.onConflictDoUpdate.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([updatedOverride]);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
        { displayName: 'Updated GPT-4' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.displayName).toBe('Updated GPT-4');
    });
  });

  describe('DELETE /api/settings/api-keys/[id]/model-overrides/[modelId]', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/settings/api-keys/invalid-id/model-overrides/gpt-4',
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'invalid-id', modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 400 when modelId is invalid', async () => {
      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUUID, modelId: '' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_MODEL_ID');
    });

    it('should return 404 when API key is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return 404 when model override is not found', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.delete.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('OVERRIDE_NOT_FOUND');
    });

    it('should delete model override successfully', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.delete.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([{ id: 'mo-1' }]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides/gpt-4`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUUID, modelId: 'gpt-4' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe('Model override deleted successfully, restored to default');
    });
  });
});
