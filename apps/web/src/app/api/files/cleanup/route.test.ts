import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/files/cleanup/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

const { mockDbInstance, mockAuthInstance, mockStorageService } = vi.hoisted(() => {
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
      createDownloadUrl: vi.fn().mockResolvedValue('https://storage.example.com/download'),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('@/libs/Auth', () => ({
  auth: mockAuthInstance,
}));

vi.mock('@lmring/storage', () => ({
  createStorageService: vi.fn(() => mockStorageService),
}));

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
  and: vi.fn(),
  inArray: vi.fn(),
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

describe('File Cleanup API', () => {
  const mockFiles = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'test-user-id',
      filename: 'test-1.png',
      mimeType: 'image/png',
      storagePath: 'users/test-user-id/1.png',
      sizeBytes: 1024,
      createdAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      userId: 'test-user-id',
      filename: 'test-2.png',
      mimeType: 'image/png',
      storagePath: 'users/test-user-id/2.png',
      sizeBytes: 2048,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/files/cleanup', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/cleanup', {
        fileIds: ['550e8400-e29b-41d4-a716-446655440001'],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when validation fails', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/files/cleanup', {
        fileIds: ['invalid-uuid'],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return cleaned 0 when empty fileIds array', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/files/cleanup', {
        fileIds: [],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual({ cleaned: 0 });
    });

    it('should return cleaned 0 when no matching files found', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValue([]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/cleanup', {
        fileIds: ['550e8400-e29b-41d4-a716-446655440001'],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual({ cleaned: 0 });
    });

    it('should delete files successfully', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValueOnce(mockFiles);

      mockDbInstance.delete.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockResolvedValue(undefined);

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/cleanup', {
        fileIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.cleaned).toBe(2);
      expect(mockStorageService.delete).toHaveBeenCalledTimes(2);
    });
  });
});
