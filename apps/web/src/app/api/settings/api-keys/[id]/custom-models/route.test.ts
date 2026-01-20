import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { GET, POST } from './route';

const { mockDbInstance, mockAuthInstance, mockGetModelIdsForProvider } = vi.hoisted(() => {
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
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    },
    mockAuthInstance: {
      api: {
        getSession: vi.fn().mockResolvedValue(mockSession),
      },
    },
    mockGetModelIdsForProvider: vi.fn().mockReturnValue([]),
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
  },
  userCustomModels: {
    id: 'id',
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    displayName: 'displayName',
    createdAt: 'createdAt',
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

vi.mock('@lmring/model-depot', () => ({
  getModelIdsForProvider: mockGetModelIdsForProvider,
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Custom Models API', () => {
  const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockApiKey = {
    id: validUUID,
    userId: 'test-user-id',
    providerName: 'openai',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelIdsForProvider.mockReturnValue([]);
  });

  describe('GET /api/settings/api-keys/[id]/custom-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/invalid-id/custom-models',
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
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return custom models successfully', async () => {
      const mockCustomModels = [
        { id: 'cm-1', modelId: 'custom-model-1', displayName: 'Custom Model 1' },
        { id: 'cm-2', modelId: 'custom-model-2', displayName: 'Custom Model 2' },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockCustomModels);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual(mockCustomModels);
    });
  });

  describe('POST /api/settings/api-keys/[id]/custom-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/invalid-id/custom-models',
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: '', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
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
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return 409 when custom model already exists', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([{ id: 'existing', modelId: 'new-model' }]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(data.error).toBe('MODEL_EXISTS');
    });

    it('should return 409 when model conflicts with builtin model', async () => {
      mockGetModelIdsForProvider.mockReturnValue(['gpt-4', 'gpt-3.5-turbo']);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(data.error).toBe('MODEL_ID_CONFLICTS_WITH_BUILTIN');
    });

    it('should create custom model successfully', async () => {
      const newModel = {
        id: 'cm-new',
        modelId: 'new-model',
        displayName: 'New Model',
      };

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([]);

      mockDbInstance.insert.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.values.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([newModel]);

      mockDbInstance.insert.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.values.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.onConflictDoUpdate.mockReturnValueOnce(mockDbInstance);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.modelId).toBe('new-model');
      expect(data.enabled).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/custom-models`,
        { modelId: 'new-model', displayName: 'New Model' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
