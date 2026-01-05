import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/conversations/[id]/share/route';
import { GET } from '@/app/api/shared/[token]/route';
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
      leftJoin: vi.fn().mockReturnThis(),
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
  or: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  sql: vi.fn(),
  gt: vi.fn(),
  gte: vi.fn(),
  lt: vi.fn(),
  lte: vi.fn(),
  ne: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  conversations: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  messages: {
    id: 'id',
    conversationId: 'conversationId',
    role: 'role',
    content: 'content',
    createdAt: 'createdAt',
  },
  sharedResults: {
    id: 'id',
    conversationId: 'conversationId',
    shareToken: 'shareToken',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
  },
  users: {
    id: 'id',
    fullName: 'fullName',
    avatarUrl: 'avatarUrl',
  },
  modelResponses: {
    id: 'id',
    messageId: 'messageId',
    modelName: 'modelName',
    providerName: 'providerName',
    responseContent: 'responseContent',
    tokensUsed: 'tokensUsed',
    responseTimeMs: 'responseTimeMs',
    displayPosition: 'displayPosition',
    createdAt: 'createdAt',
  },
  comparisonVotes: {
    id: 'id',
    messageId: 'messageId',
    comparisonType: 'comparisonType',
  },
  comparisonVoteResults: {
    id: 'id',
    comparisonVoteId: 'comparisonVoteId',
    modelName: 'modelName',
    providerName: 'providerName',
    outcome: 'outcome',
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-token-123'),
}));

setupTestEnvironment();

describe('Share and Shared Results API', () => {
  const mockConversation = {
    id: 'conv-123',
    userId: 'test-user-id',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConversationWithUser = {
    id: 'conv-123',
    title: 'Test Conversation',
    createdAt: new Date(),
    userId: 'test-user-id',
    userName: 'Test User',
    userAvatarUrl: null,
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversationId: 'conv-123',
      role: 'user' as const,
      content: 'Hello',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-123',
      role: 'assistant' as const,
      content: 'Hi there!',
      createdAt: new Date('2024-01-01'),
    },
  ];

  const mockSharedResult = {
    id: 'share-123',
    conversationId: 'conv-123',
    shareToken: 'test-token-123',
    expiresAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/conversations/[id]/share', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/conversations/conv-123/share',
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when conversation not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/conversations/conv-123/share',
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should return 404 when conversation belongs to different user', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/conversations/conv-123/share',
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should create share link without expiration', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockConversation]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([mockSharedResult]);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/conversations/conv-123/share',
        {},
      );

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.shareToken).toBe('test-token-123');
      expect(data.shareUrl).toContain('/shared/test-token-123');
      expect(data.expiresAt).toBeNull();
    });

    it('should create share link with expiration', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockConversation]);

      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([{ ...mockSharedResult, expiresAt }]);

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/conversations/conv-123/share',
        {
          expiresInDays: 7,
        },
      );

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.shareToken).toBe('test-token-123');
      expect(data.expiresAt).toBeDefined();
    });
  });

  describe('GET /api/shared/[token]', () => {
    it('should return 404 when share token not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-token-123');

      const response = await GET(request, { params: Promise.resolve({ token: 'test-token-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Shared result not found' });
    });

    it('should return 410 when share link has expired', async () => {
      const expiredShare = {
        ...mockSharedResult,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([expiredShare]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-token-123');

      const response = await GET(request, { params: Promise.resolve({ token: 'test-token-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(410);
      expect(data).toEqual({ error: 'Share link has expired' });
    });

    it('should return 404 when conversation not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockSharedResult]);

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-token-123');

      const response = await GET(request, { params: Promise.resolve({ token: 'test-token-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should return shared conversation with messages', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce(mockMessages).mockResolvedValueOnce([]);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce([]);
      mockDbInstance.limit
        .mockResolvedValueOnce([mockSharedResult])
        .mockResolvedValueOnce([mockConversationWithUser]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-token-123');

      const response = await GET(request, { params: Promise.resolve({ token: 'test-token-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation).toBeDefined();
      expect(data.conversation.id).toBe('conv-123');
      expect(data.conversation.title).toBe('Test Conversation');
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages).toHaveLength(2);
    });

    it('should not require authentication for shared links', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce(mockMessages).mockResolvedValueOnce([]);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce([]);
      mockDbInstance.limit
        .mockResolvedValueOnce([mockSharedResult])
        .mockResolvedValueOnce([mockConversationWithUser]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-token-123');

      const response = await GET(request, { params: Promise.resolve({ token: 'test-token-123' }) });

      expect(response.status).toBe(200);
    });
  });
});
