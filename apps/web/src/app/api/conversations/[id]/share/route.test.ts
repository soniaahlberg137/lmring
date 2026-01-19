import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/conversations/[id]/share/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-share-token'),
}));

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

  const createChainableMock = () => {
    type MockFn = ReturnType<typeof vi.fn>;
    const chainMethods = [
      'select',
      'from',
      'where',
      'limit',
      'offset',
      'orderBy',
      'innerJoin',
      'groupBy',
      'insert',
      'values',
      'returning',
      'update',
      'set',
      'delete',
      'onConflictDoUpdate',
    ] as const;
    const mock = {} as { [K in (typeof chainMethods)[number]]: MockFn };
    for (const method of chainMethods) {
      mock[method] = vi.fn().mockReturnValue(mock);
    }
    return mock;
  };

  return {
    mockDbInstance: createChainableMock(),
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
  conversations: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sharedResults: {
    id: 'id',
    conversationId: 'conversationId',
    shareToken: 'shareToken',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
  },
}));

setupTestEnvironment();

const UUID_CONV = '550e8400-e29b-41d4-a716-446655440000';

function resetMockChain() {
  mockDbInstance.select.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.from.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.where.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.limit.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.offset.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.orderBy.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.innerJoin.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.groupBy.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.insert.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.values.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.returning.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.update.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.set.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.delete.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.onConflictDoUpdate.mockReset().mockReturnValue(mockDbInstance);
}

describe('Share API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockChain();
  });

  describe('POST /api/conversations/[id]/share', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        { expiresInDays: 'invalid' },
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when expiresInDays exceeds maximum', async () => {
      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        { expiresInDays: 500 },
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 404 when conversation not found', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should create share without expiry', async () => {
      const mockConversation = {
        id: UUID_CONV,
        userId: 'test-user-id',
        title: 'Test Conversation',
      };
      const mockShared = {
        shareToken: 'mock-share-token',
        expiresAt: null,
      };

      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);
      mockDbInstance.returning.mockResolvedValueOnce([mockShared]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.shareToken).toBe('mock-share-token');
      expect(data.shareUrl).toContain('/shared/mock-share-token');
      expect(data.expiresAt).toBeNull();
    });

    it('should create share with expiry', async () => {
      const mockConversation = {
        id: UUID_CONV,
        userId: 'test-user-id',
        title: 'Test Conversation',
      };
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockShared = {
        shareToken: 'mock-share-token',
        expiresAt,
      };

      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);
      mockDbInstance.returning.mockResolvedValueOnce([mockShared]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        { expiresInDays: 7 },
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.shareToken).toBe('mock-share-token');
      expect(data.shareUrl).toContain('/shared/mock-share-token');
      expect(data.expiresAt).toBe(expiresAt.toISOString());
    });

    it('should verify response structure', async () => {
      const mockConversation = {
        id: UUID_CONV,
        userId: 'test-user-id',
        title: 'Test Conversation',
      };
      const mockShared = {
        shareToken: 'mock-share-token',
        expiresAt: null,
      };

      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);
      mockDbInstance.returning.mockResolvedValueOnce([mockShared]);

      const request = createMockRequest(
        'POST',
        `http://localhost:3000/api/conversations/${UUID_CONV}/share`,
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: UUID_CONV }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('shareToken');
      expect(data).toHaveProperty('shareUrl');
      expect(data).toHaveProperty('expiresAt');
      expect(typeof data.shareToken).toBe('string');
      expect(typeof data.shareUrl).toBe('string');
    });
  });
});
