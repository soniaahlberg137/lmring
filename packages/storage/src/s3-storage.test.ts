import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockSend = vi.fn();
  const mockGetSignedUrl = vi.fn();

  class MockS3Client {
    static calls: unknown[][] = [];
    send = mockSend;
    constructor(...args: unknown[]) {
      MockS3Client.calls.push(args);
    }
  }

  class MockPutObjectCommand {
    static calls: unknown[][] = [];
    params: unknown;
    constructor(params: unknown) {
      this.params = params;
      MockPutObjectCommand.calls.push([params]);
    }
  }

  class MockGetObjectCommand {
    static calls: unknown[][] = [];
    params: unknown;
    constructor(params: unknown) {
      this.params = params;
      MockGetObjectCommand.calls.push([params]);
    }
  }

  class MockDeleteObjectCommand {
    static calls: unknown[][] = [];
    params: unknown;
    constructor(params: unknown) {
      this.params = params;
      MockDeleteObjectCommand.calls.push([params]);
    }
  }

  class MockHeadObjectCommand {
    static calls: unknown[][] = [];
    params: unknown;
    constructor(params: unknown) {
      this.params = params;
      MockHeadObjectCommand.calls.push([params]);
    }
  }

  return {
    mockSend,
    mockGetSignedUrl,
    MockS3Client,
    MockPutObjectCommand,
    MockGetObjectCommand,
    MockDeleteObjectCommand,
    MockHeadObjectCommand,
  };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: mocks.MockS3Client,
  PutObjectCommand: mocks.MockPutObjectCommand,
  GetObjectCommand: mocks.MockGetObjectCommand,
  DeleteObjectCommand: mocks.MockDeleteObjectCommand,
  HeadObjectCommand: mocks.MockHeadObjectCommand,
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mocks.mockGetSignedUrl,
}));

import { createS3Storage, S3Storage } from './s3-storage';

describe('S3Storage', () => {
  let storage: S3Storage;
  const config = {
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    bucket: 'test-bucket',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.MockS3Client.calls = [];
    mocks.MockPutObjectCommand.calls = [];
    mocks.MockGetObjectCommand.calls = [];
    mocks.MockDeleteObjectCommand.calls = [];
    mocks.MockHeadObjectCommand.calls = [];
    storage = new S3Storage(config);
  });

  describe('constructor', () => {
    it('creates S3Client with correct config', () => {
      expect(mocks.MockS3Client.calls[0]?.[0]).toEqual({
        endpoint: config.endpoint,
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
      });
    });

    it('respects forcePathStyle option', () => {
      mocks.MockS3Client.calls = [];
      new S3Storage({ ...config, forcePathStyle: false });
      expect(mocks.MockS3Client.calls[0]?.[0]).toMatchObject({ forcePathStyle: false });
    });
  });

  describe('createUploadUrl', () => {
    it('returns signed upload URL', async () => {
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-upload-url.com');

      const result = await storage.createUploadUrl('test/file.txt');

      expect(result).toEqual({
        url: 'https://signed-upload-url.com',
        path: 'test/file.txt',
      });
    });

    it('passes content type option', async () => {
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

      await storage.createUploadUrl('test/file.txt', { contentType: 'image/png' });

      expect(mocks.MockPutObjectCommand.calls[0]?.[0]).toEqual({
        Bucket: 'test-bucket',
        Key: 'test/file.txt',
        ContentType: 'image/png',
      });
    });

    it('uses custom expiration from env', async () => {
      vi.stubEnv('MINIO_SIGNED_URL_EXPIRATION', '7200');
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

      await storage.createUploadUrl('test/file.txt');

      expect(mocks.mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 7200,
      });
      vi.unstubAllEnvs();
    });
  });

  describe('createDownloadUrl', () => {
    it('returns signed download URL', async () => {
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-download-url.com');

      const result = await storage.createDownloadUrl('test/file.txt');

      expect(result).toBe('https://signed-download-url.com');
    });

    it('uses custom expiration option', async () => {
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

      await storage.createDownloadUrl('test/file.txt', { expiresIn: 600 });

      expect(mocks.mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 600,
      });
    });

    it('uses env expiration when option not provided', async () => {
      vi.stubEnv('MINIO_SIGNED_URL_EXPIRATION', '1800');
      mocks.mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

      await storage.createDownloadUrl('test/file.txt');

      expect(mocks.mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 1800,
      });
      vi.unstubAllEnvs();
    });
  });

  describe('upload', () => {
    it('uploads Buffer data', async () => {
      mocks.mockSend.mockResolvedValue({});
      const buffer = Buffer.from('test content');

      await storage.upload('test/file.txt', buffer, { contentType: 'text/plain' });

      expect(mocks.MockPutObjectCommand.calls[0]?.[0]).toEqual({
        Bucket: 'test-bucket',
        Key: 'test/file.txt',
        Body: buffer,
        ContentType: 'text/plain',
      });
      expect(mocks.mockSend).toHaveBeenCalled();
    });

    it('converts Blob to Buffer before upload', async () => {
      mocks.mockSend.mockResolvedValue({});
      const blob = new Blob(['test content'], { type: 'text/plain' });

      await storage.upload('test/file.txt', blob);

      expect(mocks.MockPutObjectCommand.calls[0]?.[0]).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'test/file.txt',
        ContentType: 'application/octet-stream',
      });
    });

    it('uses default content type when not provided', async () => {
      mocks.mockSend.mockResolvedValue({});
      const buffer = Buffer.from('test');

      await storage.upload('test/file.txt', buffer);

      expect(mocks.MockPutObjectCommand.calls[0]?.[0]).toMatchObject({
        ContentType: 'application/octet-stream',
      });
    });
  });

  describe('delete', () => {
    it('deletes object from S3', async () => {
      mocks.mockSend.mockResolvedValue({});

      await storage.delete('test/file.txt');

      expect(mocks.MockDeleteObjectCommand.calls[0]?.[0]).toEqual({
        Bucket: 'test-bucket',
        Key: 'test/file.txt',
      });
      expect(mocks.mockSend).toHaveBeenCalled();
    });
  });

  describe('getAsBase64', () => {
    it('returns base64 data URI', async () => {
      const chunks = [Buffer.from('test'), Buffer.from(' content')];
      mocks.mockSend.mockResolvedValue({
        Body: (async function* () {
          for (const chunk of chunks) yield chunk;
        })(),
      });

      const result = await storage.getAsBase64('test/file.txt', 'text/plain');

      expect(result).toBe('data:text/plain;base64,dGVzdCBjb250ZW50');
    });

    it('throws error when Body is empty', async () => {
      mocks.mockSend.mockResolvedValue({ Body: null });

      await expect(storage.getAsBase64('test/file.txt', 'text/plain')).rejects.toThrow(
        'Failed to get object: test/file.txt',
      );
    });
  });

  describe('exists', () => {
    it('returns true when object exists', async () => {
      mocks.mockSend.mockResolvedValue({});

      const result = await storage.exists('test/file.txt');

      expect(result).toBe(true);
      expect(mocks.MockHeadObjectCommand.calls[0]?.[0]).toEqual({
        Bucket: 'test-bucket',
        Key: 'test/file.txt',
      });
    });

    it('returns false when object does not exist', async () => {
      mocks.mockSend.mockRejectedValue(new Error('NotFound'));

      const result = await storage.exists('test/nonexistent.txt');

      expect(result).toBe(false);
    });
  });
});

describe('createS3Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.MockS3Client.calls = [];
  });

  it('creates S3Storage with env config', () => {
    vi.stubEnv('MINIO_ENDPOINT', 'minio.example.com');
    vi.stubEnv('MINIO_PORT', '443');
    vi.stubEnv('MINIO_USE_SSL', 'true');
    vi.stubEnv('MINIO_ACCESS_KEY', 'access-key');
    vi.stubEnv('MINIO_SECRET_KEY', 'secret-key');
    vi.stubEnv('MINIO_BUCKET', 'my-bucket');
    vi.stubEnv('MINIO_REGION', 'eu-west-1');

    const storage = createS3Storage();

    expect(storage).toBeInstanceOf(S3Storage);
    expect(mocks.MockS3Client.calls[0]?.[0]).toEqual({
      endpoint: 'https://minio.example.com:443',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
      forcePathStyle: true,
    });
  });

  it('uses default values when env vars not set', () => {
    vi.stubEnv('MINIO_ACCESS_KEY', 'key');
    vi.stubEnv('MINIO_SECRET_KEY', 'secret');

    createS3Storage();

    expect(mocks.MockS3Client.calls[0]?.[0]).toEqual({
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      },
      forcePathStyle: true,
    });
  });

  it('throws error when access key missing', () => {
    vi.stubEnv('MINIO_SECRET_KEY', 'secret');

    expect(() => createS3Storage()).toThrow(
      'Missing S3/MinIO configuration: MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required',
    );
  });

  it('throws error when secret key missing', () => {
    vi.stubEnv('MINIO_ACCESS_KEY', 'key');

    expect(() => createS3Storage()).toThrow(
      'Missing S3/MinIO configuration: MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required',
    );
  });
});
