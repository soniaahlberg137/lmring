import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET } from '@/app/api/files/[id]/url/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

const { mockDbInstance, mockAuthInstance, mockStorageService, mockShouldUseBase64 } = vi.hoisted(
  () => {
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
      mockStorageService: {
        createUploadUrl: vi.fn().mockResolvedValue({ url: 'https://storage.example.com/upload' }),
        createDownloadUrl: vi.fn().mockResolvedValue('https://storage.example.com/download/file'),
        getAsBase64: vi.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      mockShouldUseBase64: vi.fn().mockReturnValue(false),
    };
  },
);

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@lmring/storage', () => ({
  createStorageService: vi.fn(() => mockStorageService),
  shouldUseBase64ForAI: mockShouldUseBase64,
}));

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  files: {
    id: 'id',
    userId: 'userId',
    filename: 'filename',
    mimeType: 'mimeType',
    storagePath: 'storagePath',
    sizeBytes: 'sizeBytes',
    createdAt: 'createdAt',
  },
}));

setupTestEnvironment();

describe('File URL API', () => {
  const mockFileRecord = {
    id: 'file-123',
    userId: 'test-user-id',
    filename: 'test-image.png',
    mimeType: 'image/png',
    storagePath: 'users/test-user-id/1234567890-uuid.png',
    sizeBytes: 1024,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShouldUseBase64.mockReturnValue(false);
  });

  describe('GET /api/files/[id]/url', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/file-123/url');
      const response = await GET(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when file not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/file-123/url');
      const response = await GET(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
    });

    it('should return signed URL for download', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockFileRecord]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/file-123/url');
      const response = await GET(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.fileId).toBe('file-123');
      expect(data.url).toBeDefined();
      expect(data.mimeType).toBe('image/png');
    });

    it('should return base64 when configured for AI use', async () => {
      mockShouldUseBase64.mockReturnValue(true);

      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([mockFileRecord]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/file-123/url');
      const response = await GET(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.fileId).toBe('file-123');
      expect(data.base64).toBeDefined();
      expect(data.mimeType).toBe('image/png');
      expect(mockStorageService.getAsBase64).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/files/[id]/url', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('DELETE', 'http://localhost:3000/api/files/file-123/url');
      const response = await DELETE(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when file not found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.limit.mockResolvedValue([]);

      const request = createMockRequest('DELETE', 'http://localhost:3000/api/files/file-123/url');
      const response = await DELETE(request, { params: Promise.resolve({ id: 'file-123' }) });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
    });
  });
});
