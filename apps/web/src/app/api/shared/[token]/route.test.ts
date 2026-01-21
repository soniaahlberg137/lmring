import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { GET } from './route';

const { mockDbInstance } = vi.hoisted(() => {
  return {
    mockDbInstance: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
  asc: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  sharedResults: {
    shareToken: 'shareToken',
    conversationId: 'conversationId',
    expiresAt: 'expiresAt',
  },
  conversations: {
    id: 'id',
    title: 'title',
    createdAt: 'createdAt',
    userId: 'userId',
  },
  users: {
    id: 'id',
    fullName: 'fullName',
    avatarUrl: 'avatarUrl',
  },
  messages: {
    id: 'id',
    conversationId: 'conversationId',
    role: 'role',
    content: 'content',
    createdAt: 'createdAt',
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
    comparisonVoteId: 'comparisonVoteId',
    modelName: 'modelName',
    providerName: 'providerName',
    outcome: 'outcome',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

describe('Shared API', () => {
  const mockSharedResult = {
    shareToken: 'test-share-token',
    conversationId: 'conv-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const mockConversation = {
    id: 'conv-123',
    title: 'Test Conversation',
    createdAt: new Date(),
    userId: 'user-123',
    userName: 'Test User',
    userAvatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    role: 'user' as const,
    content: 'Hello',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/shared/[token]', () => {
    it('should return 404 when share token is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/invalid-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'invalid-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('Shared result not found');
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

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(410);
      expect(data.error).toBe('Share link has expired');
    });

    it('should return 404 when conversation is not found', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockSharedResult]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockReturnValueOnce(Promise.resolve([]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValueOnce(Promise.resolve([]));

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversation not found');
    });

    it('should return shared conversation with single message', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockSharedResult]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockReturnValueOnce(Promise.resolve([mockConversation]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValueOnce(Promise.resolve([mockMessage]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce([]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation).toBeDefined();
      expect(data.conversation.title).toBe('Test Conversation');
      expect(data.messages).toHaveLength(1);
    });

    it('should return shared conversation with multiple messages and responses', async () => {
      const mockMessages = [mockMessage, { ...mockMessage, id: 'msg-124', content: 'Hi there' }];

      const mockResponses = [
        {
          id: 'resp-1',
          messageId: 'msg-123',
          modelName: 'gpt-4',
          providerName: 'openai',
          responseContent: 'Hello!',
          tokensUsed: 10,
          responseTimeMs: 500,
          displayPosition: 0,
          createdAt: new Date(),
        },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockSharedResult]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockReturnValueOnce(Promise.resolve([mockConversation]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValueOnce(Promise.resolve(mockMessages));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce(mockResponses);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(2);
    });

    it('should return shared conversation with votes', async () => {
      const mockVotes = [
        {
          messageId: 'msg-123',
          comparisonType: 'winner',
          modelName: 'gpt-4',
          providerName: 'openai',
          outcome: 'winner',
        },
      ];

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockSharedResult]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.leftJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockReturnValueOnce(Promise.resolve([mockConversation]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValueOnce(Promise.resolve([mockMessage]));

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce([]);

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.innerJoin.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockVotes);

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.messages[0].voteInfo).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('GET', 'http://localhost:3000/api/shared/test-share-token');
      const response = await GET(request, {
        params: Promise.resolve({ token: 'test-share-token' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
