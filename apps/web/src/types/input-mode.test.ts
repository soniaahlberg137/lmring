import { describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/env', () => ({
  FILE_UPLOAD_CONFIG: {
    MAX_IMAGE_SIZE_MB: 10,
    MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
    MAX_IMAGES: 10,
  },
  env: {},
}));

import {
  INPUT_MODE_ABILITY_MAP,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES,
} from './input-mode';

describe('Image upload constants', () => {
  it('should have MAX_IMAGES set to 10', () => {
    expect(MAX_IMAGES).toBe(10);
  });

  it('should have MAX_IMAGE_SIZE_MB set to 10', () => {
    expect(MAX_IMAGE_SIZE_MB).toBe(10);
  });

  it('should have MAX_IMAGE_SIZE_BYTES calculated correctly (10 * 1024 * 1024)', () => {
    expect(MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_IMAGE_SIZE_BYTES).toBe(10485760);
  });
});

describe('INPUT_MODE_ABILITY_MAP', () => {
  it('should map search mode to search ability', () => {
    expect(INPUT_MODE_ABILITY_MAP.search).toBe('search');
  });

  it('should map imageGenerate mode to imageOutput ability', () => {
    expect(INPUT_MODE_ABILITY_MAP.imageGenerate).toBe('imageOutput');
  });

  it('should map upload mode to vision ability', () => {
    expect(INPUT_MODE_ABILITY_MAP.upload).toBe('vision');
  });

  it('should map videoGenerate mode to videoOutput ability', () => {
    expect(INPUT_MODE_ABILITY_MAP.videoGenerate).toBe('videoOutput');
  });

  it('should have exactly 4 mappings', () => {
    expect(Object.keys(INPUT_MODE_ABILITY_MAP)).toHaveLength(4);
  });
});
