import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/conversations/[id]/full/route';
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
  and: vi.fn(),
  asc: vi.fn(),
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
    attachments: 'attachments',
    createdAt: 'createdAt',
  },
  modelResponses: {
    id: 'id',
    messageId: 'messageId',
    modelName: 'modelName',
    providerName: 'providerName',
    responseContent: 'responseContent',
    attachments: 'attachments',
    tokensUsed: 'tokensUsed',
    responseTimeMs: 'responseTimeMs',
    displayPosition: 'displayPosition',
    createdAt: 'createdAt',
  },
}));

setupTestEnvironment();

describe('Full Conversation API', () => {
  const mockConversation = {
    id: 'conv-123',
    userId: 'test-user-id',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversationId: 'conv-123',
      role: 'user' as const,
      content: 'Hello',
      attachments: null,
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-123',
      role: 'assistant' as const,
      content: '',
      attachments: null,
      createdAt: new Date('2024-01-01T10:00:05Z'),
    },
  ];

  const mockResponses = [
    {
      id: 'resp-1',
      messageId: 'msg-2',
      modelName: 'gpt-4o',
      providerName: 'openai',
      responseContent: 'Hello! How can I help?',
      attachments: null,
      tokensUsed: 50,
      responseTimeMs: 1200,
      displayPosition: 0,
      createdAt: new Date('2024-01-01T10:00:05Z'),
    },
    {
      id: 'resp-2',
      messageId: 'msg-2',
      modelName: 'claude-3-5-sonnet',
      providerName: 'anthropic',
      responseContent: 'Hi there! What can I do for you?',
      attachments: null,
      tokensUsed: 45,
      responseTimeMs: 1100,
      displayPosition: 1,
      createdAt: new Date('2024-01-01T10:00:06Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/conversations/[id]/full', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
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
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should return full conversation with messages and responses', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy
        .mockResolvedValueOnce(mockMessages)
        .mockResolvedValueOnce(mockResponses);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation).toBeDefined();
      expect(data.conversation.id).toBe('conv-123');
      expect(data.conversation.title).toBe('Test Conversation');
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages).toHaveLength(2);
    });

    it('should return conversation with empty messages list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation).toBeDefined();
      expect(data.messages).toEqual([]);
    });

    it('should map multiple responses to correct messages', async () => {
      const multiMessageConvo = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          role: 'user' as const,
          content: 'First question',
          attachments: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          role: 'assistant' as const,
          content: '',
          attachments: null,
          createdAt: new Date('2024-01-01T10:00:05Z'),
        },
        {
          id: 'msg-3',
          conversationId: 'conv-123',
          role: 'user' as const,
          content: 'Second question',
          attachments: null,
          createdAt: new Date('2024-01-01T10:01:00Z'),
        },
        {
          id: 'msg-4',
          conversationId: 'conv-123',
          role: 'assistant' as const,
          content: '',
          attachments: null,
          createdAt: new Date('2024-01-01T10:01:05Z'),
        },
      ];

      const multiResponses = [
        {
          id: 'resp-1',
          messageId: 'msg-2',
          modelName: 'gpt-4o',
          providerName: 'openai',
          responseContent: 'First answer from GPT',
          attachments: null,
          tokensUsed: 50,
          responseTimeMs: 1200,
          displayPosition: 0,
          createdAt: new Date('2024-01-01T10:00:05Z'),
        },
        {
          id: 'resp-2',
          messageId: 'msg-2',
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          responseContent: 'First answer from Claude',
          attachments: null,
          tokensUsed: 45,
          responseTimeMs: 1100,
          displayPosition: 1,
          createdAt: new Date('2024-01-01T10:00:06Z'),
        },
        {
          id: 'resp-3',
          messageId: 'msg-4',
          modelName: 'gpt-4o',
          providerName: 'openai',
          responseContent: 'Second answer from GPT',
          attachments: null,
          tokensUsed: 60,
          responseTimeMs: 1300,
          displayPosition: 0,
          createdAt: new Date('2024-01-01T10:01:05Z'),
        },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy
        .mockResolvedValueOnce(multiMessageConvo)
        .mockResolvedValueOnce(multiResponses);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(4);

      // User messages should not have responses
      expect(data.messages[0].responses).toBeUndefined();
      expect(data.messages[2].responses).toBeUndefined();

      // First assistant message (msg-2) should have 2 responses
      expect(data.messages[1].responses).toHaveLength(2);
      expect(data.messages[1].responses[0].modelName).toBe('gpt-4o');
      expect(data.messages[1].responses[1].modelName).toBe('claude-3-5-sonnet');

      // Second assistant message (msg-4) should have 1 response
      expect(data.messages[3].responses).toHaveLength(1);
      expect(data.messages[3].responses[0].modelName).toBe('gpt-4o');
    });

    it('should return user messages without responses field', async () => {
      const userOnlyMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          role: 'user' as const,
          content: 'Hello',
          attachments: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValueOnce(userOnlyMessages).mockResolvedValueOnce([]);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].id).toBe('msg-1');
      expect(data.messages[0].content).toBe('Hello');
      expect(data.messages[0].responses).toBeUndefined();
    });

    it('should return responses ordered by displayPosition', async () => {
      const singleAssistantMessage = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          role: 'assistant' as const,
          content: '',
          attachments: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      // Responses returned in displayPosition order (0, 1, 2)
      const orderedResponses = [
        {
          id: 'resp-1',
          messageId: 'msg-1',
          modelName: 'gpt-4o',
          providerName: 'openai',
          responseContent: 'First',
          attachments: null,
          tokensUsed: 50,
          responseTimeMs: 1200,
          displayPosition: 0,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'resp-2',
          messageId: 'msg-1',
          modelName: 'claude-3-5-sonnet',
          providerName: 'anthropic',
          responseContent: 'Second',
          attachments: null,
          tokensUsed: 45,
          responseTimeMs: 1100,
          displayPosition: 1,
          createdAt: new Date('2024-01-01T10:00:01Z'),
        },
        {
          id: 'resp-3',
          messageId: 'msg-1',
          modelName: 'gemini-pro',
          providerName: 'google',
          responseContent: 'Third',
          attachments: null,
          tokensUsed: 55,
          responseTimeMs: 1000,
          displayPosition: 2,
          createdAt: new Date('2024-01-01T10:00:02Z'),
        },
      ];

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.innerJoin.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy
        .mockResolvedValueOnce(singleAssistantMessage)
        .mockResolvedValueOnce(orderedResponses);

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/conversations/conv-123/full',
      );
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.messages[0].responses).toHaveLength(3);

      // Verify responses maintain their order
      expect(data.messages[0].responses[0].displayPosition).toBe(0);
      expect(data.messages[0].responses[0].modelName).toBe('gpt-4o');
      expect(data.messages[0].responses[1].displayPosition).toBe(1);
      expect(data.messages[0].responses[1].modelName).toBe('claude-3-5-sonnet');
      expect(data.messages[0].responses[2].displayPosition).toBe(2);
      expect(data.messages[0].responses[2].modelName).toBe('gemini-pro');
    });
  });
});
