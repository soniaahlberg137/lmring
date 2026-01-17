import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/files/upload/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

const { mockDbInstance, mockAuthInstance, mockArcjet, mockStorageService } = vi.hoisted(() => {
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
    mockArcjet: {
      withRule: vi.fn().mockReturnThis(),
      protect: vi.fn().mockResolvedValue({ isDenied: () => false }),
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

vi.mock('@/libs/Arcjet', () => ({
  default: mockArcjet,
}));

vi.mock('@arcjet/next', () => ({
  tokenBucket: vi.fn(),
}));

vi.mock('@lmring/storage', () => ({
  createStorageService: vi.fn(() => mockStorageService),
}));

vi.mock('@lmring/database', () => ({
  db: mockDbInstance,
  eq: vi.fn(),
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

vi.mock('@lmring/env', () => ({
  FILE_UPLOAD_CONFIG: {
    MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  },
}));

setupTestEnvironment();

describe('File Upload API', () => {
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
    mockArcjet.protect.mockResolvedValue({ isDenied: () => false });
  });

  describe('POST /api/files/upload', () => {
    it('should return 429 when rate limited', async () => {
      mockArcjet.protect.mockResolvedValue({ isDenied: () => true });

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        filename: 'test.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many requests');
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        filename: 'test.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when filename is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        mimeType: 'image/png',
        sizeBytes: 1024,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when mimeType is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        filename: 'test.png',
        sizeBytes: 1024,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when sizeBytes is missing', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        filename: 'test.png',
        mimeType: 'image/png',
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should initialize file upload successfully', async () => {
      mockDbInstance.insert.mockReturnValue(mockDbInstance);
      mockDbInstance.values.mockReturnValue(mockDbInstance);
      mockDbInstance.returning.mockResolvedValue([mockFileRecord]);

      const request = createMockRequest('POST', 'http://localhost:3000/api/files/upload', {
        filename: 'test-image.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
      });

      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.fileId).toBe('file-123');
      expect(data.uploadUrl).toBeDefined();
      expect(data.storagePath).toBeDefined();
    });
  });

  describe('GET /api/files/upload', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockAuthInstance.api.getSession).mockResolvedValueOnce(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/upload');

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return user files list', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValue([mockFileRecord]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/upload');

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
    });

    it('should return empty list when no files', async () => {
      mockDbInstance.select.mockReturnValue(mockDbInstance);
      mockDbInstance.from.mockReturnValue(mockDbInstance);
      mockDbInstance.where.mockReturnValue(mockDbInstance);
      mockDbInstance.orderBy.mockResolvedValue([]);

      const request = createMockRequest('GET', 'http://localhost:3000/api/files/upload');

      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.files).toEqual([]);
    });
  });
});
