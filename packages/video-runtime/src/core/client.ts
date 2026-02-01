/**
 * Video Client
 *
 * Simplified client interface for video generation with a single provider.
 */

import type {
  VideoClient,
  VideoGenerationParams,
  VideoProvider,
  VideoProviderCapabilities,
  VideoRuntimeConfig,
  VideoRuntimeProvider,
  VideoStreamEvent,
} from '../types';
import { videoProviderFactory } from './factory';

/**
 * Options for creating a video client.
 */
export interface CreateVideoClientOptions {
  /** Provider type */
  provider: VideoRuntimeProvider;
  /** API key for authentication */
  apiKey: string;
  /** Custom base URL (optional) */
  baseURL?: string;
  /** Request timeout in milliseconds (optional) */
  timeout?: number;
  /** Polling interval in milliseconds (optional) */
  pollInterval?: number;
  /** Additional headers (optional) */
  headers?: Record<string, string>;
}

/**
 * Video client implementation wrapping a single provider.
 */
class VideoClientImpl implements VideoClient {
  private readonly provider: VideoProvider;

  constructor(provider: VideoProvider) {
    this.provider = provider;
  }

  get capabilities(): VideoProviderCapabilities {
    return this.provider.capabilities;
  }

  get providerId(): VideoRuntimeProvider {
    return this.provider.providerId;
  }

  async *generate(
    params: VideoGenerationParams,
    signal?: AbortSignal,
  ): AsyncGenerator<VideoStreamEvent> {
    yield* this.provider.generate(params, signal);
  }
}

/**
 * Create a video client for a specific provider.
 *
 * @example
 * ```typescript
 * const client = createVideoClient({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * for await (const event of client.generate({
 *   model: 'sora-2',
 *   input: {
 *     type: 'text-to-video',
 *     prompt: 'A cat playing piano',
 *   },
 *   duration: 8,
 * })) {
 *   if (event.type === 'video') {
 *     console.log('Video URL:', event.video.url);
 *   }
 * }
 * ```
 */
export function createVideoClient(options: CreateVideoClientOptions): VideoClient {
  const config: VideoRuntimeConfig = {
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    timeout: options.timeout,
    pollInterval: options.pollInterval,
    headers: options.headers,
  };

  const provider = videoProviderFactory.createProvider(options.provider, config);
  return new VideoClientImpl(provider);
}

/**
 * Create a video client from an existing provider instance.
 */
export function createVideoClientFromProvider(provider: VideoProvider): VideoClient {
  return new VideoClientImpl(provider);
}
