import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockS3Storage = { type: 's3' };
const mockSupabaseStorage = { type: 'supabase' };

vi.mock('./s3-storage', () => ({
  createS3Storage: vi.fn(() => mockS3Storage),
  S3Storage: vi.fn(),
}));

vi.mock('./supabase-storage', () => ({
  createSupabaseStorage: vi.fn(() => mockSupabaseStorage),
  SupabaseStorage: vi.fn(),
}));

import { createStorageService, shouldUseBase64ForAI } from './index';

describe('createStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns SupabaseStorage by default', () => {
    const result = createStorageService();
    expect(result).toBe(mockSupabaseStorage);
  });

  it('returns SupabaseStorage when DEPLOYMENT_MODE is saas', () => {
    vi.stubEnv('DEPLOYMENT_MODE', 'saas');

    const result = createStorageService();

    expect(result).toBe(mockSupabaseStorage);
  });

  it('returns S3Storage when DEPLOYMENT_MODE is selfhost', () => {
    vi.stubEnv('DEPLOYMENT_MODE', 'selfhost');

    const result = createStorageService();

    expect(result).toBe(mockS3Storage);
  });

  it('returns SupabaseStorage for unknown DEPLOYMENT_MODE', () => {
    vi.stubEnv('DEPLOYMENT_MODE', 'unknown');

    const result = createStorageService();

    expect(result).toBe(mockSupabaseStorage);
  });
});

describe('shouldUseBase64ForAI', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when LLM_IMAGE_BASE64 is "1"', () => {
    vi.stubEnv('LLM_IMAGE_BASE64', '1');

    expect(shouldUseBase64ForAI()).toBe(true);
  });

  it('returns false when LLM_IMAGE_BASE64 is not set', () => {
    expect(shouldUseBase64ForAI()).toBe(false);
  });

  it('returns false when LLM_IMAGE_BASE64 is "0"', () => {
    vi.stubEnv('LLM_IMAGE_BASE64', '0');

    expect(shouldUseBase64ForAI()).toBe(false);
  });

  it('returns false when LLM_IMAGE_BASE64 is "true"', () => {
    vi.stubEnv('LLM_IMAGE_BASE64', 'true');

    expect(shouldUseBase64ForAI()).toBe(false);
  });
});
