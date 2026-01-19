import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from '@/app/api/comparison-votes/route';
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
    const mock = {} as { [K in (typeof chainMethods)[number]]: MockFn } & { transaction: MockFn };
    for (const method of chainMethods) {
      mock[method] = vi.fn().mockReturnValue(mock);
    }
    mock.transaction = vi.fn();
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
  inArray: vi.fn(),
  sql: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  conversations: {
    id: 'id',
    userId: 'userId',
  },
  messages: {
    id: 'id',
    conversationId: 'conversationId',
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
  modelComparisonStats: {
    modelName: 'modelName',
    providerName: 'providerName',
    comparisonType: 'comparisonType',
    totalComparisons: 'totalComparisons',
    wins: 'wins',
    losses: 'losses',
    ties: 'ties',
    allBadCount: 'allBadCount',
    winRate: 'winRate',
  },
}));

setupTestEnvironment();

const UUID_1 = '550e8400-e29b-41d4-a716-446655440001';
const UUID_2 = '550e8400-e29b-41d4-a716-446655440002';
const UUID_MSG = '550e8400-e29b-41d4-a716-446655440000';
const UUID_VOTE = '550e8400-e29b-41d4-a716-446655440003';

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
  mockDbInstance.transaction.mockReset();
}

describe('Comparison Votes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockChain();
  });

  describe('POST /api/comparison-votes', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when messageId is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        comparisonType: 'text',
        voteType: 'winner',
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when comparisonType is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        voteType: 'winner',
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when voteType is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when participantIds is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when winnerId is missing for winner vote', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 404 when message not found', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('Message not found or unauthorized');
    });

    it('should return 404 when message belongs to different user', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([{ id: UUID_MSG, userId: 'other-user-id' }]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe('Message not found or unauthorized');
    });

    it('should return 400 when participant responses not found', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([{ id: UUID_MSG, userId: 'test-user-id' }]);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce([{ id: UUID_1, messageId: UUID_MSG }]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Some model responses not found or do not belong to this message');
    });

    it('should return 409 when vote already exists', async () => {
      const mockResponses = [
        { id: UUID_1, messageId: UUID_MSG, modelName: 'gpt-4o', providerName: 'openai' },
        {
          id: UUID_2,
          messageId: UUID_MSG,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
        },
      ];

      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce(mockResponses)
        .mockReturnValue(mockDbInstance);
      mockDbInstance.limit
        .mockResolvedValueOnce([{ id: UUID_MSG, userId: 'test-user-id' }])
        .mockResolvedValueOnce([{ id: UUID_VOTE }]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(data.error).toBe('Vote already exists for this message');
      expect(data.code).toBe('VOTE_ALREADY_EXISTS');
    });

    it('should create winner vote successfully', async () => {
      const mockResponses = [
        { id: UUID_1, messageId: UUID_MSG, modelName: 'gpt-4o', providerName: 'openai' },
        {
          id: UUID_2,
          messageId: UUID_MSG,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
        },
      ];

      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        { modelResponseId: UUID_1, modelName: 'gpt-4o', providerName: 'openai', outcome: 'winner' },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'loser',
        },
      ];

      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce(mockResponses)
        .mockReturnValue(mockDbInstance);
      mockDbInstance.limit
        .mockResolvedValueOnce([{ id: UUID_MSG, userId: 'test-user-id' }])
        .mockResolvedValueOnce([]);

      mockDbInstance.transaction.mockImplementation(async (callback) => {
        const txMock = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValueOnce([mockVote]).mockResolvedValueOnce(mockResults),
        };
        return callback(txMock);
      });
      mockDbInstance.groupBy.mockResolvedValue([]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'winner',
        winnerId: UUID_1,
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.vote).toBeDefined();
      expect(data.vote.id).toBe(UUID_VOTE);
      expect(data.vote.voteType).toBe('winner');
      expect(data.vote.winnerId).toBe(UUID_1);
      expect(data.vote.results).toHaveLength(2);
    });

    it('should create tie vote successfully', async () => {
      const mockResponses = [
        { id: UUID_1, messageId: UUID_MSG, modelName: 'gpt-4o', providerName: 'openai' },
        {
          id: UUID_2,
          messageId: UUID_MSG,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
        },
      ];

      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        { modelResponseId: UUID_1, modelName: 'gpt-4o', providerName: 'openai', outcome: 'tie' },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'tie',
        },
      ];

      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce(mockResponses)
        .mockReturnValue(mockDbInstance);
      mockDbInstance.limit
        .mockResolvedValueOnce([{ id: UUID_MSG, userId: 'test-user-id' }])
        .mockResolvedValueOnce([]);

      mockDbInstance.transaction.mockImplementation(async (callback) => {
        const txMock = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValueOnce([mockVote]).mockResolvedValueOnce(mockResults),
        };
        return callback(txMock);
      });
      mockDbInstance.groupBy.mockResolvedValue([]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'tie',
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.vote).toBeDefined();
      expect(data.vote.voteType).toBe('tie');
      expect(data.vote.results).toHaveLength(2);
      expect(data.vote.results.every((r: { outcome: string }) => r.outcome === 'tie')).toBe(true);
    });

    it('should create all_bad vote successfully', async () => {
      const mockResponses = [
        { id: UUID_1, messageId: UUID_MSG, modelName: 'gpt-4o', providerName: 'openai' },
        {
          id: UUID_2,
          messageId: UUID_MSG,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
        },
      ];

      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        {
          modelResponseId: UUID_1,
          modelName: 'gpt-4o',
          providerName: 'openai',
          outcome: 'all_bad',
        },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'all_bad',
        },
      ];

      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce(mockResponses)
        .mockReturnValue(mockDbInstance);
      mockDbInstance.limit
        .mockResolvedValueOnce([{ id: UUID_MSG, userId: 'test-user-id' }])
        .mockResolvedValueOnce([]);

      mockDbInstance.transaction.mockImplementation(async (callback) => {
        const txMock = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValueOnce([mockVote]).mockResolvedValueOnce(mockResults),
        };
        return callback(txMock);
      });
      mockDbInstance.groupBy.mockResolvedValue([]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/comparison-votes', {
        messageId: UUID_MSG,
        comparisonType: 'text',
        voteType: 'all_bad',
        participantIds: [UUID_1, UUID_2],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.vote).toBeDefined();
      expect(data.vote.voteType).toBe('all_bad');
      expect(data.vote.results).toHaveLength(2);
      expect(data.vote.results.every((r: { outcome: string }) => r.outcome === 'all_bad')).toBe(
        true,
      );
    });
  });

  describe('GET /api/comparison-votes', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when messageId is missing', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/comparison-votes');

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'messageId is required' });
    });

    it('should return null when vote not found', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.vote).toBeNull();
    });

    it('should return vote with winner type', async () => {
      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        { modelResponseId: UUID_1, modelName: 'gpt-4o', providerName: 'openai', outcome: 'winner' },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'loser',
        },
      ];

      mockDbInstance.limit.mockResolvedValueOnce([mockVote]);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance).mockResolvedValueOnce(mockResults);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.vote).toBeDefined();
      expect(data.vote.voteType).toBe('winner');
      expect(data.vote.winnerId).toBe(UUID_1);
      expect(data.vote.results).toHaveLength(2);
    });

    it('should return vote with tie type', async () => {
      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        { modelResponseId: UUID_1, modelName: 'gpt-4o', providerName: 'openai', outcome: 'tie' },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'tie',
        },
      ];

      mockDbInstance.limit.mockResolvedValueOnce([mockVote]);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance).mockResolvedValueOnce(mockResults);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.vote).toBeDefined();
      expect(data.vote.voteType).toBe('tie');
      expect(data.vote.winnerId).toBeUndefined();
    });

    it('should return vote with all_bad type', async () => {
      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        {
          modelResponseId: UUID_1,
          modelName: 'gpt-4o',
          providerName: 'openai',
          outcome: 'all_bad',
        },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'all_bad',
        },
      ];

      mockDbInstance.limit.mockResolvedValueOnce([mockVote]);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance).mockResolvedValueOnce(mockResults);

      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.vote).toBeDefined();
      expect(data.vote.voteType).toBe('all_bad');
      expect(data.vote.winnerId).toBeUndefined();
    });
  });

  describe('DELETE /api/comparison-votes', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await DELETE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when messageId is missing', async () => {
      const request = createMockRequest('DELETE', 'http://localhost:3000/api/comparison-votes');

      const response = await DELETE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'messageId is required' });
    });

    it('should return 404 when vote not found', async () => {
      mockDbInstance.limit.mockResolvedValueOnce([]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await DELETE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Vote not found' });
    });

    it('should delete vote successfully', async () => {
      const mockVote = { id: UUID_VOTE, messageId: UUID_MSG, comparisonType: 'text' };
      const mockResults = [
        { modelResponseId: UUID_1, modelName: 'gpt-4o', providerName: 'openai', outcome: 'winner' },
        {
          modelResponseId: UUID_2,
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          outcome: 'loser',
        },
      ];

      mockDbInstance.limit.mockResolvedValueOnce([mockVote]);
      mockDbInstance.where
        .mockReturnValueOnce(mockDbInstance)
        .mockResolvedValueOnce(mockResults)
        .mockReturnValue(mockDbInstance);
      mockDbInstance.groupBy.mockResolvedValue([]);

      const request = createMockRequest(
        'DELETE',
        `http://localhost:3000/api/comparison-votes?messageId=${UUID_MSG}`,
      );

      const response = await DELETE(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Vote deleted successfully' });
    });
  });
});
