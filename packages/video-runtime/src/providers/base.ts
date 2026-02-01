/**
 * Base Video Provider
 *
 * Abstract base class implementing common functionality for video providers,
 * including polling logic, heartbeat generation, and parameter validation.
 */

import type {
  ValidationResult,
  VideoGenerationParams,
  VideoProvider,
  VideoProviderCapabilities,
  VideoRuntimeConfig,
  VideoRuntimeProvider,
  VideoStreamEvent,
  VideoTaskState,
} from '../types';
import { sleep, VideoError } from '../utils';

const DEFAULT_POLL_INTERVAL = 2000;
const DEFAULT_MAX_POLL_DURATION = 600_000;
const HEARTBEAT_INTERVAL = 5000;

/**
 * Abstract base class for video providers.
 *
 * Provides common functionality:
 * - Polling loop with heartbeats
 * - Parameter validation
 * - Error handling
 *
 * Subclasses must implement:
 * - createTask(): Submit a video generation request
 * - pollTaskStatus(): Check the status of a generation task
 * - resolveModelId(): Map model IDs to provider-specific format
 */
export abstract class BaseVideoProvider implements VideoProvider {
  abstract readonly providerId: VideoRuntimeProvider;
  abstract readonly displayName: string;
  abstract readonly defaultBaseURL: string;
  abstract readonly capabilities: VideoProviderCapabilities;

  protected readonly config: VideoRuntimeConfig;

  constructor(config: VideoRuntimeConfig) {
    this.config = config;
  }

  protected get baseURL(): string {
    return this.config.baseURL ?? this.defaultBaseURL;
  }

  protected get apiKey(): string {
    return this.config.apiKey;
  }

  protected get pollInterval(): number {
    return this.config.pollInterval ?? DEFAULT_POLL_INTERVAL;
  }

  protected get timeout(): number {
    return this.config.timeout ?? 300_000;
  }

  protected get headers(): Record<string, string> {
    return this.config.headers ?? {};
  }

  /**
   * Create authorization headers for API requests.
   */
  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      ...this.headers,
    };
  }

  /**
   * Submit a video generation task to the provider.
   *
   * @param params - Generation parameters
   * @param signal - Abort signal
   * @returns Task ID
   */
  protected abstract createTask(
    params: VideoGenerationParams,
    signal?: AbortSignal,
  ): Promise<string>;

  /**
   * Poll the status of a video generation task.
   *
   * @param taskId - Task ID to check
   * @param signal - Abort signal
   * @returns Current task state
   */
  protected abstract pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState>;

  /**
   * Resolve a model ID to the provider-specific format.
   */
  abstract resolveModelId(modelId: string): string;

  /**
   * Validate generation parameters.
   */
  validateParams(params: VideoGenerationParams): ValidationResult {
    const errors: string[] = [];

    if (params.input.type === 'text-to-video' && !this.capabilities.textToVideo) {
      errors.push(`Provider ${this.providerId} does not support text-to-video`);
    }

    if (params.input.type === 'image-to-video' && !this.capabilities.imageToVideo) {
      errors.push(`Provider ${this.providerId} does not support image-to-video`);
    }

    if (params.duration && params.duration > this.capabilities.maxDurationSeconds) {
      errors.push(
        `Duration ${params.duration}s exceeds maximum ${this.capabilities.maxDurationSeconds}s`,
      );
    }

    if (params.aspectRatio && !this.capabilities.aspectRatios.includes(params.aspectRatio)) {
      errors.push(
        `Aspect ratio ${params.aspectRatio} not supported. Available: ${this.capabilities.aspectRatios.join(', ')}`,
      );
    }

    if (params.quality && !this.capabilities.qualityTiers.includes(params.quality)) {
      errors.push(
        `Quality tier ${params.quality} not supported. Available: ${this.capabilities.qualityTiers.join(', ')}`,
      );
    }

    if (params.audio && !this.capabilities.audio) {
      errors.push(`Provider ${this.providerId} does not support audio generation`);
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  /**
   * Generate a video with streaming events.
   *
   * This implements the polling loop with heartbeats.
   */
  async *generate(
    params: VideoGenerationParams,
    signal?: AbortSignal,
  ): AsyncGenerator<VideoStreamEvent> {
    const validation = this.validateParams(params);
    if (!validation.valid) {
      yield {
        type: 'error',
        error: VideoError.invalidParams(
          validation.errors?.join('; ') ?? 'Invalid parameters',
          this.providerId,
        ).toInfo(),
      };
      return;
    }

    let taskId: string;
    try {
      taskId = await this.createTask(params, signal);
    } catch (error) {
      yield {
        type: 'error',
        error: VideoError.from(error, {
          provider: this.providerId,
          model: params.model,
        }).toInfo(),
      };
      return;
    }

    const startTime = Date.now();
    const maxDuration = DEFAULT_MAX_POLL_DURATION;
    let lastHeartbeat = Date.now();

    while (true) {
      if (signal?.aborted) {
        yield {
          type: 'error',
          error: {
            code: 'NETWORK_ERROR',
            message: 'Request aborted',
            provider: this.providerId,
            retryable: false,
          },
        };
        return;
      }

      if (Date.now() - startTime > maxDuration) {
        yield {
          type: 'error',
          error: VideoError.pollTimeout(taskId, this.providerId).toInfo(),
        };
        return;
      }

      if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        yield { type: 'heartbeat', timestamp: Date.now() };
        lastHeartbeat = Date.now();
      }

      let state: VideoTaskState;
      try {
        state = await this.pollTaskStatus(taskId, signal);
      } catch (error) {
        yield {
          type: 'error',
          error: VideoError.from(error, {
            provider: this.providerId,
            model: params.model,
          }).toInfo(),
        };
        return;
      }

      switch (state.status) {
        case 'completed':
          if (state.result) {
            yield { type: 'video', video: state.result };
          } else {
            yield {
              type: 'error',
              error: VideoError.generationFailed(
                'Task completed but no video result',
                this.providerId,
                params.model,
              ).toInfo(),
            };
          }
          return;

        case 'failed':
          yield {
            type: 'error',
            error: state.error ?? {
              code: 'GENERATION_FAILED',
              message: 'Video generation failed',
              provider: this.providerId,
              model: params.model,
              retryable: false,
            },
          };
          return;

        case 'cancelled':
          yield {
            type: 'error',
            error: {
              code: 'GENERATION_FAILED',
              message: 'Video generation was cancelled',
              provider: this.providerId,
              model: params.model,
              retryable: false,
            },
          };
          return;

        case 'processing':
        case 'queued':
          // Emit progress if available
          if (state.progress !== undefined) {
            yield {
              type: 'progress',
              progress: state.progress,
              stage: state.stage,
            };
          }
          break;
      }

      await sleep(this.pollInterval, signal);
    }
  }
}

/**
 * Strip provider prefix from model ID.
 *
 * Examples:
 * - 'openai/sora-2' -> 'sora-2'
 * - 'sora-2' -> 'sora-2'
 */
export function stripProviderPrefix(modelId: string): string {
  const slashIndex = modelId.indexOf('/');
  return slashIndex >= 0 ? modelId.slice(slashIndex + 1) : modelId;
}
