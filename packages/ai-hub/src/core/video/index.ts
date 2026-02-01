/**
 * Video Generation
 *
 * Re-exports from @lmring/video-runtime for backward compatibility.
 */

import {
  createVideoClient,
  detectProviderFromModel,
  type VideoStreamEvent as RuntimeVideoStreamEvent,
  type VideoRuntimeProvider,
} from '@lmring/video-runtime';
import type {
  VideoGenerationParams,
  VideoGenerationResult,
  VideoStreamEvent,
} from '../../types/runtime';

export interface VideoGenerationConfig {
  apiKey: string;
  baseURL?: string;
  /** Explicit provider to use (auto-detected from model if not specified) */
  provider?: VideoRuntimeProvider;
}

/**
 * Map runtime video event to ai-hub VideoStreamEvent.
 * Maintains backward compatibility with existing ai-hub interface.
 */
function mapStreamEvent(event: RuntimeVideoStreamEvent): VideoStreamEvent | null {
  switch (event.type) {
    case 'heartbeat':
      return { type: 'heartbeat' };
    case 'progress':
      // Progress events map to heartbeat for backward compatibility
      return { type: 'heartbeat' };
    case 'video':
      return {
        type: 'video',
        video: {
          url: event.video.url,
          mimeType: event.video.mimeType,
          thumbnailUrl: event.video.thumbnailUrl,
          duration: event.video.duration,
        },
      };
    case 'error':
      return {
        type: 'error',
        error: event.error.message,
      };
    default:
      return null;
  }
}

/**
 * Check if a baseURL is an official Google API endpoint.
 * Returns true if no baseURL is provided (use default official endpoint).
 */
function isOfficialGoogleEndpoint(baseURL?: string): boolean {
  if (!baseURL) return true; // No baseURL = use default official endpoint

  const officialPatterns = [
    /^https:\/\/generativelanguage\.googleapis\.com/,
    /^https:\/\/.*\.googleapis\.com/,
    /^https:\/\/aiplatform\.googleapis\.com/,
  ];

  return officialPatterns.some((pattern) => pattern.test(baseURL));
}

/**
 * Detect provider from model ID or baseURL.
 * Switches to openai-compatible for third-party proxy URLs.
 */
function resolveProvider(config: VideoGenerationConfig, model: string): VideoRuntimeProvider {
  if (config.provider) {
    // Google provider with non-official baseURL → use openai-compatible
    if (
      config.provider === 'google' &&
      config.baseURL &&
      !isOfficialGoogleEndpoint(config.baseURL)
    ) {
      return 'openai-compatible';
    }
    return config.provider;
  }

  if (config.baseURL?.includes('/videos/generations')) {
    return 'openai-compatible';
  }

  const detected = detectProviderFromModel(model);
  if (detected) {
    if (detected === 'google' && config.baseURL && !isOfficialGoogleEndpoint(config.baseURL)) {
      return 'openai-compatible';
    }
    return detected;
  }

  if (config.baseURL) {
    return 'openai-compatible';
  }

  return 'openai';
}

/**
 * Generate a video using the appropriate provider.
 * Yields heartbeat events while polling for completion.
 *
 * @param config - Configuration including API key and optional base URL
 * @param params - Video generation parameters
 * @param signal - Optional abort signal for cancellation
 */
export async function* generateVideo(
  config: VideoGenerationConfig,
  params: VideoGenerationParams,
  signal?: AbortSignal,
): AsyncGenerator<VideoStreamEvent> {
  const provider = resolveProvider(config, params.model);

  const client = createVideoClient({
    provider,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  for await (const event of client.generate(
    {
      model: params.model,
      input: {
        type: 'text-to-video',
        prompt: params.prompt,
      },
      width: params.width,
      height: params.height,
      duration: params.duration,
    },
    signal,
  )) {
    const mapped = mapStreamEvent(event);
    if (mapped) {
      yield mapped;
    }
  }
}

// Re-export types for backward compatibility
export type { VideoGenerationParams, VideoGenerationResult, VideoStreamEvent };
