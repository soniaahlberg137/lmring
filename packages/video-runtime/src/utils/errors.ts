/**
 * Video Runtime Errors
 *
 * Custom error classes and error handling utilities.
 */

import type { VideoErrorCode, VideoErrorInfo } from '../types';

/**
 * Custom error class for video generation errors.
 */
export class VideoError extends Error {
  readonly code: VideoErrorCode;
  readonly provider?: string;
  readonly model?: string;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(info: VideoErrorInfo) {
    super(info.message);
    this.name = 'VideoError';
    this.code = info.code;
    this.provider = info.provider;
    this.model = info.model;
    this.retryable = info.retryable ?? false;
    this.cause = info.cause;
  }

  /**
   * Convert to VideoErrorInfo for serialization.
   */
  toInfo(): VideoErrorInfo {
    return {
      code: this.code,
      message: this.message,
      provider: this.provider,
      model: this.model,
      retryable: this.retryable,
      cause: this.cause,
    };
  }

  /**
   * Create a VideoError from an unknown error.
   */
  static from(error: unknown, defaults?: Partial<VideoErrorInfo>): VideoError {
    if (error instanceof VideoError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for common HTTP error patterns
      const message = error.message;

      if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return new VideoError({
          code: 'TIMEOUT',
          message: `Request timeout: ${message}`,
          retryable: true,
          cause: error,
          ...defaults,
        });
      }

      if (message.includes('network') || message.includes('ECONNREFUSED')) {
        return new VideoError({
          code: 'NETWORK_ERROR',
          message: `Network error: ${message}`,
          retryable: true,
          cause: error,
          ...defaults,
        });
      }

      if (message.includes('rate limit') || message.includes('429')) {
        return new VideoError({
          code: 'RATE_LIMIT',
          message: `Rate limited: ${message}`,
          retryable: true,
          cause: error,
          ...defaults,
        });
      }

      return new VideoError({
        code: 'UNKNOWN',
        message: message,
        retryable: false,
        cause: error,
        ...defaults,
      });
    }

    return new VideoError({
      code: 'UNKNOWN',
      message: String(error),
      retryable: false,
      cause: error,
      ...defaults,
    });
  }

  /**
   * Create an invalid params error.
   */
  static invalidParams(message: string, provider?: string): VideoError {
    return new VideoError({
      code: 'INVALID_PARAMS',
      message,
      provider,
      retryable: false,
    });
  }

  /**
   * Create a provider error.
   */
  static providerError(message: string, provider: string, cause?: unknown): VideoError {
    return new VideoError({
      code: 'PROVIDER_ERROR',
      message,
      provider,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a timeout error.
   */
  static timeout(message: string, provider?: string): VideoError {
    return new VideoError({
      code: 'TIMEOUT',
      message,
      provider,
      retryable: true,
    });
  }

  /**
   * Create a poll timeout error.
   */
  static pollTimeout(taskId: string, provider?: string): VideoError {
    return new VideoError({
      code: 'POLL_TIMEOUT',
      message: `Video generation task ${taskId} timed out`,
      provider,
      retryable: false,
    });
  }

  /**
   * Create a model not found error.
   */
  static modelNotFound(model: string, provider?: string): VideoError {
    return new VideoError({
      code: 'MODEL_NOT_FOUND',
      message: `Model '${model}' not found`,
      provider,
      model,
      retryable: false,
    });
  }

  /**
   * Create a provider not found error.
   */
  static providerNotFound(provider: string): VideoError {
    return new VideoError({
      code: 'PROVIDER_NOT_FOUND',
      message: `Provider '${provider}' not found or not configured`,
      provider,
      retryable: false,
    });
  }

  /**
   * Create a generation failed error.
   */
  static generationFailed(
    message: string,
    provider?: string,
    model?: string,
    cause?: unknown,
  ): VideoError {
    return new VideoError({
      code: 'GENERATION_FAILED',
      message,
      provider,
      model,
      retryable: false,
      cause,
    });
  }

  /**
   * Create a content policy error.
   */
  static contentPolicy(message: string, provider?: string): VideoError {
    return new VideoError({
      code: 'CONTENT_POLICY',
      message,
      provider,
      retryable: false,
    });
  }

  /**
   * Create an insufficient credits error.
   */
  static insufficientCredits(provider: string): VideoError {
    return new VideoError({
      code: 'INSUFFICIENT_CREDITS',
      message: `Insufficient credits for provider '${provider}'`,
      provider,
      retryable: false,
    });
  }
}

/**
 * Check if an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof VideoError) {
    return error.retryable;
  }
  return false;
}

/**
 * Get error info from an unknown error.
 */
export function getErrorInfo(error: unknown, defaults?: Partial<VideoErrorInfo>): VideoErrorInfo {
  return VideoError.from(error, defaults).toInfo();
}
