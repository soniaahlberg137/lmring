import { describe, expect, it } from 'vitest';
import {
  BaseVideoProvider,
  createVideoClient,
  createVideoRouter,
  detectProviderFromModel,
  getErrorInfo,
  isRetryableError,
  VideoError,
  VideoProviderFactory,
  VideoRouter,
} from './index';

describe('video-runtime exports', () => {
  it('should export core functions', () => {
    expect(createVideoClient).toBeDefined();
    expect(createVideoRouter).toBeDefined();
    expect(detectProviderFromModel).toBeDefined();
  });

  it('should export VideoProviderFactory class', () => {
    expect(VideoProviderFactory).toBeDefined();
  });

  it('should export VideoRouter class', () => {
    expect(VideoRouter).toBeDefined();
  });

  it('should export BaseVideoProvider class', () => {
    expect(BaseVideoProvider).toBeDefined();
  });

  it('should export utility functions', () => {
    expect(getErrorInfo).toBeDefined();
    expect(isRetryableError).toBeDefined();
    expect(VideoError).toBeDefined();
  });
});
