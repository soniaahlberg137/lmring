/**
 * Video Provider Interface Types
 *
 * Defines the contract that all video generation providers must implement.
 */

import type { VideoProviderCapabilities, VideoRuntimeConfig, VideoRuntimeProvider } from './config';
import type { VideoGenerationParams, VideoStreamEvent, VideoTaskState } from './video';

// Re-export for convenience
export type { VideoProviderCapabilities, VideoRuntimeConfig, VideoRuntimeProvider };

/**
 * Validation result for generation parameters.
 */
export interface ValidationResult {
  /** Whether the parameters are valid */
  valid: boolean;
  /** Validation error messages if invalid */
  errors?: string[];
}

/**
 * Interface that all video providers must implement.
 */
export interface VideoProvider {
  /** Unique identifier for this provider */
  readonly providerId: VideoRuntimeProvider;

  /** Human-readable display name */
  readonly displayName: string;

  /** Default API base URL for this provider */
  readonly defaultBaseURL: string;

  /** Provider capabilities */
  readonly capabilities: VideoProviderCapabilities;

  /**
   * Generate a video with streaming events.
   *
   * @param params - Generation parameters
   * @param signal - Optional abort signal for cancellation
   * @yields Stream of video generation events
   */
  generate(params: VideoGenerationParams, signal?: AbortSignal): AsyncGenerator<VideoStreamEvent>;

  /**
   * Validate generation parameters before submission.
   *
   * @param params - Parameters to validate
   * @returns Validation result with any errors
   */
  validateParams(params: VideoGenerationParams): ValidationResult;

  /**
   * Resolve a model ID to the provider-specific format.
   *
   * @param modelId - Model ID (may include provider prefix)
   * @returns Provider-specific model ID
   */
  resolveModelId(modelId: string): string;
}

/**
 * Options for creating a video provider instance.
 */
export interface VideoProviderOptions {
  /** Provider type */
  provider: VideoRuntimeProvider;
  /** Provider configuration */
  config: VideoRuntimeConfig;
}

/**
 * Factory interface for creating video providers.
 */
export interface VideoProviderFactory {
  /**
   * Create a video provider instance.
   *
   * @param options - Provider options
   * @returns Video provider instance
   */
  createProvider(options: VideoProviderOptions): VideoProvider;

  /**
   * Check if a provider type is supported.
   *
   * @param provider - Provider type to check
   * @returns Whether the provider is supported
   */
  isSupported(provider: VideoRuntimeProvider): boolean;
}

/**
 * Internal interface for providers that support task-based generation.
 * Used by BaseVideoProvider for polling logic.
 */
export interface TaskBasedProvider {
  /**
   * Create a video generation task.
   *
   * @param params - Generation parameters
   * @param signal - Optional abort signal
   * @returns Task ID
   */
  createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string>;

  /**
   * Poll the status of a video generation task.
   *
   * @param taskId - Task ID to check
   * @param signal - Optional abort signal
   * @returns Current task state
   */
  pollTask(taskId: string, signal?: AbortSignal): Promise<VideoTaskState>;
}

/**
 * Options for the video router.
 */
export interface VideoRouterOptions {
  /** Provider configurations keyed by provider type */
  providers: Partial<Record<VideoRuntimeProvider, VideoRuntimeConfig>>;
  /** Default provider to use when model doesn't match any prefix */
  defaultProvider?: VideoRuntimeProvider;
}

/**
 * Router interface for directing requests to the appropriate provider.
 */
export interface VideoRouter {
  /**
   * Route a generation request to the appropriate provider.
   *
   * @param params - Generation parameters
   * @param signal - Optional abort signal
   * @yields Stream of video generation events
   */
  generate(params: VideoGenerationParams, signal?: AbortSignal): AsyncGenerator<VideoStreamEvent>;

  /**
   * Get the provider for a given model ID.
   *
   * @param modelId - Model ID to look up
   * @returns Provider instance or undefined if not found
   */
  getProviderForModel(modelId: string): VideoProvider | undefined;
}

/**
 * Client interface for simplified video generation.
 */
export interface VideoClient {
  /**
   * Generate a video with the configured provider.
   *
   * @param params - Generation parameters
   * @param signal - Optional abort signal
   * @yields Stream of video generation events
   */
  generate(params: VideoGenerationParams, signal?: AbortSignal): AsyncGenerator<VideoStreamEvent>;

  /**
   * Get the provider capabilities.
   */
  readonly capabilities: VideoProviderCapabilities;

  /**
   * Get the provider ID.
   */
  readonly providerId: VideoRuntimeProvider;
}
