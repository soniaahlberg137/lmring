import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock createEnv to bypass environment validation
vi.mock('@t3-oss/env-nextjs', () => ({
  createEnv: vi.fn(() => ({})),
}));

import { FILE_UPLOAD_CONFIG } from './index';

describe('FILE_UPLOAD_CONFIG', () => {
  it('MAX_IMAGE_SIZE_MB equals 10', () => {
    expect(FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB).toBe(10);
  });

  it('MAX_IMAGE_SIZE_BYTES equals 10485760', () => {
    expect(FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES).toBe(10485760);
  });

  it('MAX_IMAGES equals 10', () => {
    expect(FILE_UPLOAD_CONFIG.MAX_IMAGES).toBe(10);
  });
});
