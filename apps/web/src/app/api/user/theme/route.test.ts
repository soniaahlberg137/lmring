import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT } from '@/app/api/user/theme/route';
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
  userPreferences: {
    id: 'id',
    userId: 'userId',
    theme: 'theme',
    themeConfig: 'themeConfig',
    language: 'language',
    defaultModels: 'defaultModels',
    configSource: 'configSource',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

setupTestEnvironment();

describe('User Theme API', () => {
  const mockThemeConfig = {
    mode: 'dark' as const,
    seedColor: { l: 0.55, c: 0.18, h: 255 },
    presetName: 'ocean-blue',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/theme', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/user/theme');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns themeConfig from preferences', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([
        { id: 'pref-1', userId: 'test-user-id', themeConfig: mockThemeConfig },
      ]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/user/theme');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.themeConfig).toEqual(mockThemeConfig);
    });

    it('returns null when no preferences row exists', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/user/theme');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.themeConfig).toBeNull();
    });
  });

  describe('PUT /api/user/theme', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/user/theme',
        mockThemeConfig,
      );
      const response = await PUT(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 for invalid payload', async () => {
      const request = createMockRequest('PUT', 'http://localhost:3000/api/user/theme', {
        mode: 'invalid',
      });

      const response = await PUT(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('updates existing preferences row', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([{ id: 'pref-1', userId: 'test-user-id' }]);

      mockDbInstance.update.mockReturnValue(mockDbInstance);
      mockDbInstance.set.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([
        { id: 'pref-1', userId: 'test-user-id', themeConfig: mockThemeConfig },
      ]);

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/user/theme',
        mockThemeConfig,
      );
      const response = await PUT(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.themeConfig).toEqual(mockThemeConfig);
    });

    it('creates preferences row when missing', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([
        { id: 'pref-2', userId: 'test-user-id', themeConfig: mockThemeConfig },
      ]);

      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/user/theme',
        mockThemeConfig,
      );
      const response = await PUT(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.themeConfig).toEqual(mockThemeConfig);
    });
  });
});
