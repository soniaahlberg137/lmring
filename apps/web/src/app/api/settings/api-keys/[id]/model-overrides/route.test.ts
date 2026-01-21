import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { GET, POST } from './route';

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
    createdAt: 'createdAt',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Model Overrides API', () => {
  const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockApiKey = {
    id: validUUID,
    userId: 'test-user-id',
    providerName: 'openai',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/[id]/model-overrides', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/invalid-id/model-overrides',
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
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should return model overrides successfully', async () => {
      const mockOverrides = [
        { id: 'mo-1', modelId: 'gpt-4', displayName: 'Custom GPT-4' },
        { id: 'mo-2', modelId: 'gpt-3.5-turbo', displayName: 'Custom GPT-3.5' },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockApiKey]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockOverrides);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.overrides).toEqual(mockOverrides);
    });
  });

  describe('POST /api/settings/api-keys/[id]/model-overrides', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when ID format is invalid', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/settings/api-keys/invalid-id/model-overrides',
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_ID');
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
        { modelId: '', displayName: 'Custom Model' },
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
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('API_KEY_NOT_FOUND');
    });

    it('should create model override successfully', async () => {
      const newOverride = {
        id: 'mo-new',
        modelId: 'gpt-4',
        displayName: 'Custom GPT-4',
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
      mockDbInstance.returning.mockResolvedValueOnce([newOverride]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.modelId).toBe('gpt-4');
      expect(data.displayName).toBe('Custom GPT-4');
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/settings/api-keys/${validUUID}/model-overrides`,
        { modelId: 'gpt-4', displayName: 'Custom GPT-4' },
      );
      const response = await POST(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});
