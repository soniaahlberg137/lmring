import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as GET_CUSTOM } from '@/app/api/settings/api-keys/all/custom-models/route';
import { GET as GET_ENABLED } from '@/app/api/settings/api-keys/all/enabled-models/route';
import { GET as GET_OVERRIDES } from '@/app/api/settings/api-keys/all/model-overrides/route';
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
}));

vi.mock('@lmring/database/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
    providerName: 'providerName',
  },
  userEnabledModels: {
    userId: 'userId',
    apiKeyId: 'apiKeyId',
    modelId: 'modelId',
    enabled: 'enabled',
  },
  userCustomModels: {
    userId: 'userId',
    apiKeyId: 'apiKeyId',
    id: 'id',
    modelId: 'modelId',
    displayName: 'displayName',
    createdAt: 'createdAt',
  },
  userModelOverrides: {
    userId: 'userId',
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

setupTestEnvironment();

describe('API Keys All Routes', () => {
  const mockApiKeys = [
    { id: 'key-1', providerName: 'openai' },
    { id: 'key-2', providerName: 'anthropic' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/api-keys/all/enabled-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/enabled-models',
      );
      const response = await GET_ENABLED(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return empty models when no API keys exist', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValue([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/enabled-models',
      );
      const response = await GET_ENABLED(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual({});
    });

    it('should return enabled models grouped by API key', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockApiKeys).mockResolvedValueOnce([
        { apiKeyId: 'key-1', modelId: 'gpt-4o', enabled: true },
        { apiKeyId: 'key-1', modelId: 'gpt-3.5', enabled: false },
        { apiKeyId: 'key-2', modelId: 'claude-3', enabled: true },
      ]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/enabled-models',
      );
      const response = await GET_ENABLED(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toBeDefined();
      expect(data.models['key-1']).toHaveLength(2);
      expect(data.models['key-2']).toHaveLength(1);
    });
  });

  describe('GET /api/settings/api-keys/all/custom-models', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET_CUSTOM(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return empty models when no API keys exist', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValue([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET_CUSTOM(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toEqual({});
    });

    it('should return custom models grouped by API key', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockApiKeys).mockResolvedValueOnce([
        {
          apiKeyId: 'key-1',
          id: 'model-1',
          modelId: 'my-model',
          displayName: 'My Model',
          createdAt: new Date(),
        },
      ]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/custom-models',
      );
      const response = await GET_CUSTOM(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.models).toBeDefined();
      expect(data.models['key-1']).toHaveLength(1);
    });
  });

  describe('GET /api/settings/api-keys/all/model-overrides', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET_OVERRIDES(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return empty overrides when no API keys exist', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValue([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET_OVERRIDES(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.overrides).toEqual({});
    });

    it('should return model overrides grouped by API key', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockApiKeys).mockResolvedValueOnce([
        {
          apiKeyId: 'key-1',
          modelId: 'gpt-4o',
          displayName: 'GPT-4 Turbo',
          groupName: 'Premium',
          abilities: null,
          supportsStreaming: true,
          priceCurrency: 'USD',
          inputPrice: 0.01,
          outputPrice: 0.03,
        },
        {
          apiKeyId: 'key-2',
          modelId: 'claude-3',
          displayName: 'Claude 3 Opus',
          groupName: 'Enterprise',
          abilities: null,
          supportsStreaming: true,
          priceCurrency: 'USD',
          inputPrice: 0.015,
          outputPrice: 0.075,
        },
      ]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/settings/api-keys/all/model-overrides',
      );
      const response = await GET_OVERRIDES(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.overrides).toBeDefined();
      expect(data.overrides['key-1']).toHaveLength(1);
      expect(data.overrides['key-2']).toHaveLength(1);
    });
  });
});
