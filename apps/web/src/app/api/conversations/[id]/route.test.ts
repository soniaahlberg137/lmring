import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';
import { DELETE, GET, PUT } from './route';

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
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockReturnThis(),
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
  conversations: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

vi.mock('@/libs/error-logging', () => ({
  logError: vi.fn(),
}));

setupTestEnvironment();

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
  });

  describe('GET /api/conversations/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations/conv-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when conversation is not found', async () => {
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

    it('should return conversation successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockConversation]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations/conv-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation.id).toBe(mockConversation.id);
      expect(data.conversation.title).toBe(mockConversation.title);
      expect(data.conversation.userId).toBe(mockConversation.userId);
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('GET', 'http://localhost:3000/api/conversations/conv-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('PUT /api/conversations/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: 'Updated Title',
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when title is missing', async () => {
      const request = createMockRequest(
        'PUT',
        'http://localhost:3000/api/conversations/conv-123',
        {},
      );
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Title is required' });
    });

    it('should return 400 when title is empty', async () => {
      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: '   ',
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Title is required' });
    });

    it('should return 404 when conversation is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: 'Updated Title',
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should update conversation successfully', async () => {
      const updatedConversation = { ...mockConversation, title: 'Updated Title' };

      mockDbInstance.select.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.from.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.limit.mockResolvedValueOnce([mockConversation]);

      mockDbInstance.update.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.set.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.where.mockReturnValueOnce(mockDbInstance);
      mockDbInstance.returning.mockResolvedValueOnce([updatedConversation]);

      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: 'Updated Title',
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.conversation.title).toBe('Updated Title');
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('PUT', 'http://localhost:3000/api/conversations/conv-123', {
        title: 'Updated Title',
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('DELETE /api/conversations/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/conversations/conv-123',
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when conversation is not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/conversations/conv-123',
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Conversation not found' });
    });

    it('should delete conversation successfully', async () => {
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
      expect(data.message).toBe('Conversation deleted successfully');
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'DELETE',
        'http://localhost:3000/api/conversations/conv-123',
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: 'conv-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});
