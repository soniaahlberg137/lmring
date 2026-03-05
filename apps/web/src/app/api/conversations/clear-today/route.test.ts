import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/conversations/clear-today/route';
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
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
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
}));

vi.mock('@lmring/database/schema', () => ({
  userPreferences: {
    id: 'id',
    userId: 'userId',
    todayClearedAt: 'todayClearedAt',
    updatedAt: 'updatedAt',
  },
}));

setupTestEnvironment();

function resetMockChain() {
  mockDbInstance.select.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.from.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.where.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.insert.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.values.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.returning.mockReset().mockResolvedValue([]);
  mockDbInstance.update.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.set.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.onConflictDoUpdate.mockReset().mockReturnValue(mockDbInstance);
}

describe('POST /api/conversations/clear-today', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockChain();
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

    const request = createMockRequest(
      'POST',
      'http://localhost:3000/api/conversations/clear-today',
    );
    const response = await POST(request);
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should upsert todayClearedAt and return clearedAt', async () => {
    const now = new Date();

    mockDbInstance.insert.mockReturnValue(mockDbInstance);
    mockDbInstance.values.mockReturnValue(mockDbInstance);
    mockDbInstance.onConflictDoUpdate.mockReturnValue(mockDbInstance);
    mockDbInstance.returning.mockResolvedValue([{ todayClearedAt: now }]);

    const request = createMockRequest(
      'POST',
      'http://localhost:3000/api/conversations/clear-today',
    );
    const response = await POST(request);
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.clearedAt).toBeDefined();
    expect(mockDbInstance.insert).toHaveBeenCalled();
    expect(mockDbInstance.onConflictDoUpdate).toHaveBeenCalled();
  });
});
