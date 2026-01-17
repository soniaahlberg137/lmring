import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GET as GET_CUSTOM,
  POST as POST_CUSTOM,
} from '@/app/api/settings/api-keys/[id]/custom-models/route';
import { GET } from '@/app/api/settings/api-keys/[id]/enabled-models/route';
import { DELETE, PUT } from '@/app/api/settings/api-keys/[id]/model-overrides/[modelId]/route';
import {
  GET as GET_OVERRIDES,
  POST as POST_OVERRIDES,
} from '@/app/api/settings/api-keys/[id]/model-overrides/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

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
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
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
    providerName: 'providerName',
    encryptedKey: 'encryptedKey',
    configSource: 'configSource',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  userEnabledModels: {
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    enabled: 'enabled',
  },
  userCustomModels: {
    id: 'id',
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    displayName: 'displayName',
    createdAt: 'createdAt',
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
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

vi.mock('@lmring/model-depot', () => ({
  getModelIdsForProvider: vi.fn().mockReturnValue(['gpt-4o', 'gpt-3.5-turbo']),
}));

setupTestEnvironment();

const validUuid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const invalidUuid = 'invalid-uuid';

const mockApiKey = {
  id: validUuid,
  userId: 'test-user-id',
  providerName: 'openai',
  encryptedKey: 'encrypted_key',
  configSource: 'manual',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('API Keys Sub-Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/[id]/enabled-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID format', async () => {
      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${invalidUuid}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: invalidUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 404 when API key not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return enabled models list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance).mockResolvedValueOnce([
        { modelId: 'gpt-4o', enabled: true },
        { modelId: 'gpt-3.5-turbo', enabled: false },
      ]);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/enabled-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);
    });
  });

  describe('GET /api/settings/api-keys/[id]/custom-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/custom-models`,
      );
      const response = await GET_CUSTOM(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid UUID format', async () => {
      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${invalidUuid}/custom-models`,
      );
      const response = await GET_CUSTOM(request, { params: Promise.resolve({ id: invalidUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return custom models list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce([
          { id: 'custom-1', modelId: 'my-model', displayName: 'My Model', createdAt: new Date() },
        ]);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/custom-models`,
      );
      const response = await GET_CUSTOM(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toBeDefined();
    });
  });

  describe('POST /api/settings/api-keys/[id]/custom-models', () => {
    it('should return 400 when validation fails', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/custom-models`,
        { modelId: '' },
      );
      const response = await POST_CUSTOM(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 409 when model already exists', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit
        .mockResolvedValueOnce([mockApiKey])
        .mockResolvedValueOnce([{ id: 'existing', modelId: 'my-model' }]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/custom-models`,
        { modelId: 'my-model', displayName: 'My Model' },
      );
      const response = await POST_CUSTOM(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(data.error).toBe('MODEL_EXISTS');
    });

    it('should create custom model successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]).mockResolvedValueOnce([]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([
        { id: 'new-model', modelId: 'my-model', displayName: 'My Model' },
      ]);
      mockDbInstance.onConflictDoUpdate.mockReturnValue(mockDbInstance);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/custom-models`,
        { modelId: 'my-model', displayName: 'My Model' },
      );
      const response = await POST_CUSTOM(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.modelId).toBe('my-model');
    });
  });

  describe('GET /api/settings/api-keys/[id]/model-overrides', () => {
    it('should return model overrides list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce([
          { id: 'override-1', modelId: 'gpt-4o', displayName: 'GPT-4 Turbo', groupName: 'Premium' },
        ]);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides`,
      );
      const response = await GET_OVERRIDES(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.overrides).toBeDefined();
    });
  });

  describe('POST /api/settings/api-keys/[id]/model-overrides', () => {
    it('should create model override successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.onConflictDoUpdate.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([
        { id: 'override-1', modelId: 'gpt-4o', displayName: 'Custom GPT-4' },
      ]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides`,
        { modelId: 'gpt-4o', displayName: 'Custom GPT-4' },
      );
      const response = await POST_OVERRIDES(request, {
        params: Promise.resolve({ id: validUuid }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.modelId).toBe('gpt-4o');
    });
  });

  describe('PUT /api/settings/api-keys/[id]/model-overrides/[modelId]', () => {
    it('should return 400 for invalid model ID', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      const longModelId = 'a'.repeat(250);
      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides/${longModelId}`,
        { displayName: 'Updated' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUuid, modelId: longModelId }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_MODEL_ID');
    });

    it('should update model override successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.onConflictDoUpdate.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([
        { id: 'override-1', modelId: 'gpt-4o', displayName: 'Updated GPT-4' },
      ]);

      const request = createMockRequest(
        'PUT',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides/gpt-4o`,
        { displayName: 'Updated GPT-4' },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: validUuid, modelId: 'gpt-4o' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.displayName).toBe('Updated GPT-4');
    });
  });

  describe('DELETE /api/settings/api-keys/[id]/model-overrides/[modelId]', () => {
    it('should return 404 when override not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      mockDbInstance.delete.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides/gpt-4o`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUuid, modelId: 'gpt-4o' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('OVERRIDE_NOT_FOUND');
    });

    it('should delete model override successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockApiKey]);

      mockDbInstance.delete.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([{ id: 'override-1' }]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/settings/api-keys/${validUuid}/model-overrides/gpt-4o`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: validUuid, modelId: 'gpt-4o' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.message).toContain('deleted successfully');
    });
  });
});
