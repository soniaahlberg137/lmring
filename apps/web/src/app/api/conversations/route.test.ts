import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, PUT } from '@/app/api/conversations/[id]/route';
import { GET as GET_LIST, POST as POST_CREATE } from '@/app/api/conversations/route';
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
      selectDistinct: vi.fn().mockReturnThis(),
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
  modelResponses: {
    id: 'id',
    messageId: 'messageId',
    modelName: 'modelName',
    providerName: 'providerName',
  },
  comparisonVotes: {
    id: 'id',
    userId: 'userId',
    messageId: 'messageId',
    comparisonType: 'comparisonType',
  },
  comparisonVoteResults: {
    id: 'id',
    comparisonVoteId: 'comparisonVoteId',
    modelResponseId: 'modelResponseId',
    modelName: 'modelName',
    providerName: 'providerName',
    outcome: 'outcome',
  },
  webdevSessions: {
    id: 'id',
    conversationId: 'conversationId',
    createdAt: 'createdAt',
  },
  webdevResponses: {
    id: 'id',
    sessionId: 'sessionId',
    modelId: 'modelId',
  },
}));

setupTestEnvironment();

function resetMockChain() {
  mockDbInstance.select.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.selectDistinct.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.from.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.where.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.limit.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.offset.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.orderBy.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.innerJoin.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.groupBy.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.insert.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.values.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.returning.mockReset().mockResolvedValue([]);
  mockDbInstance.update.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.set.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.delete.mockReset().mockReturnValue(mockDbInstance);
  mockDbInstance.onConflictDoUpdate.mockReset().mockReturnValue(mockDbInstance);
}

describe('Conversations API', () => {
  const mockConversation = {
    id: 'conv-123',
    userId: 'test-user-id',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockChain();
  });

  describe('GET /api/conversations', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations');
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return user conversations with pagination', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy
        .mockReturnValueOnce(mockDbInstance) // conversations query (chains to limit)
        .mockResolvedValueOnce([]); // webdev sessions query (terminal)
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([mockConversation]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations?limit=10&offset=0',
      );
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(Array.isArray(data.conversations)).toBe(true);
    });

    it('should return empty conversations list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations');
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toEqual([]);
    });

    it('should cap limit at 100', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockReturnValueOnce(mockDbInstance).mockResolvedValueOnce([]);
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([mockConversation]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations?limit=200');
      const response = await GET_LIST(request);
      await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(mockDbInstance.limit).toHaveBeenCalled();
    });

    it('should return conversations with first message when withFirstMessage=true', async () => {
      const mockFirstMessages = [
        { conversationId: 'conv-123', content: 'Hello, this is my first message' },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy
        .mockReturnValueOnce(mockDbInstance) // conversations query
        .mockResolvedValueOnce([]) // webdev sessions query
        .mockResolvedValueOnce(mockFirstMessages); // first messages query
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([mockConversation]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations?withFirstMessage=true',
      );
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(data.conversations[0].firstMessage).toBe('Hello, this is my first message');
    });

    it('should return conversations with models when withModels=true', async () => {
      const mockModels = [
        { conversationId: 'conv-123', modelName: 'gpt-4o', providerName: 'openai' },
        { conversationId: 'conv-123', modelName: 'claude-3-5-sonnet', providerName: 'anthropic' },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.selectDistinct.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance) // conversations query
        .mockReturnValueOnce(mockDbInstance) // webdev sessions query (chains to orderBy)
        .mockResolvedValueOnce(mockModels) // models query (terminal)
        .mockResolvedValueOnce([]); // webdevModelsUsed query (terminal)
      mockDbInstance.orderBy
        .mockReturnValueOnce(mockDbInstance) // conversations query
        .mockResolvedValueOnce([]); // webdev sessions query
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([mockConversation]);
      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations?withModels=true',
      );
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(data.conversations[0].models).toBeDefined();
      expect(data.conversations[0].models).toHaveLength(2);
    });

    it('should return conversations with vote info when withVotes=true', async () => {
      const mockVotesData = [
        {
          conversationId: 'conv-123',
          voteId: 'vote-1',
          outcome: 'winner',
          modelName: 'gpt-4o',
          providerName: 'openai',
        },
        {
          conversationId: 'conv-123',
          voteId: 'vote-1',
          outcome: 'loser',
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
        },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance) // conversations query
        .mockReturnValueOnce(mockDbInstance) // webdev sessions query (chains to orderBy)
        .mockResolvedValueOnce(mockVotesData); // votes query (terminal)
      mockDbInstance.orderBy
        .mockReturnValueOnce(mockDbInstance) // conversations query
        .mockResolvedValueOnce([]); // webdev sessions query
      mockDbInstance.limit.mockReturnValue(mockDbInstance);
      mockDbInstance.offset.mockResolvedValue([mockConversation]);
      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations?withVotes=true',
      );
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(data.conversations[0].voteInfo).toBeDefined();
      expect(data.conversations[0].voteInfo.hasVotes).toBe(true);
      expect(data.conversations[0].voteInfo.winnerModel).toBe('gpt-4o');
    });

    it('should return conversations with combined flags', async () => {
      // Create a thenable mock that is both chainable and resolvable
      // This handles the case where where() is sometimes terminal (modelsUsed, votesData)
      // and sometimes needs to chain to orderBy() (firstMessages)
      const thenableMock = {
        select: vi.fn().mockReturnThis(),
        selectDistinct: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
        innerJoin: vi.fn().mockReturnThis(),
        // biome-ignore lint/suspicious/noThenProperty: Mock needs to be thenable for promise resolution
        then: (resolve: (v: unknown[]) => void) => Promise.resolve([]).then(resolve),
      };

      // Main query: select().from().where().orderBy().limit().offset()
      // First where() call (main query) should return mockDbInstance to continue chain
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.offset.mockResolvedValueOnce([mockConversation]);

      // Subsequent where() calls (from Promise.all queries) return thenable mock
      mockDbInstance.where.mockReturnValue(thenableMock);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations?withFirstMessage=true&withModels=true&withVotes=true',
      );
      const response = await GET_LIST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(data.conversations[0].voteInfo).toEqual({ hasVotes: false });
    });
  });

  describe('POST /api/conversations', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/conversations', {
        title: 'New Conversation',
      });

      const response = await POST_CREATE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when title is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/conversations', {
        title: '',
      });

      const response = await POST_CREATE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should create a new conversation', async () => {
      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([mockConversation]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/conversations', {
        title: 'New Conversation',
      });

      const response = await POST_CREATE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.conversation).toBeDefined();
      expect(data.conversation.title).toBe('Test Conversation');
    });
  });

  describe('GET /api/conversations/[id]', () => {
    it('should return 404 when conversation not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations/conv-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should return conversation when found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockConversation]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations/conv-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation).toBeDefined();
      expect(data.conversation.id).toBe('conv-123');
    });
  });

  describe('PUT /api/conversations/[id]', () => {
    it('should update conversation title', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.update.mockReturnValue(mockDbInstance);
      mockDbInstance.set.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([{ ...mockConversation, title: 'Updated Title' }]);

      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: 'Updated Title',
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/conversations/[id]', () => {
    it('should delete conversation', async () => {
      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.delete.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(undefined);

      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/conversations/conv-123',
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Conversation deleted successfully' });
    });
  });
});
