/**
 * Video Router
 *
 * Routes video generation requests to the appropriate provider
 * based on model ID prefixes or explicit provider configuration.
 */

import type {
  VideoGenerationParams,
  VideoProvider,
  VideoRouterOptions,
  VideoRuntimeConfig,
  VideoRuntimeProvider,
  VideoStreamEvent,
} from '../types';
import { VideoError } from '../utils';
import { videoProviderFactory } from './factory';

/**
 * Model prefix to provider mapping.
 */
const MODEL_PREFIX_MAP: Record<string, VideoRuntimeProvider> = {
  // OpenAI Sora
  'openai/': 'openai',
  sora: 'openai',

  // Google Veo
  'google/': 'google',
  veo: 'google',

  // MiniMax Hailuo
  'minimax/': 'minimax',
  hailuo: 'minimax',

  // Kling
  kling: 'kling',
  'kuaishou/': 'kling',

  // Seedance
  seedance: 'seedance',
  'bytedance/': 'seedance',
  doubao: 'seedance',

  // Vidu
  vidu: 'vidu',
};

/**
 * Detect provider from model ID.
 *
 * @param modelId - Model identifier
 * @returns Detected provider or undefined
 */
export function detectProviderFromModel(modelId: string): VideoRuntimeProvider | undefined {
  const lowerModel = modelId.toLowerCase();

  // Check exact prefix matches first
  for (const [prefix, provider] of Object.entries(MODEL_PREFIX_MAP)) {
    if (prefix.endsWith('/')) {
      if (lowerModel.startsWith(prefix)) {
        return provider;
      }
    } else {
      if (lowerModel.startsWith(prefix)) {
        return provider;
      }
    }
  }

  return undefined;
}

/**
 * Video router for directing requests to appropriate providers.
 */
export class VideoRouter {
  private readonly providers: Map<VideoRuntimeProvider, VideoProvider> = new Map();
  private readonly defaultProvider?: VideoRuntimeProvider;

  constructor(options: VideoRouterOptions) {
    this.defaultProvider = options.defaultProvider;

    // Initialize providers from config
    for (const [provider, config] of Object.entries(options.providers)) {
      if (config) {
        const providerType = provider as VideoRuntimeProvider;
        const instance = videoProviderFactory.createProvider(providerType, config);
        this.providers.set(providerType, instance);
      }
    }
  }

  /**
   * Get the provider for a given model ID.
   *
   * @param modelId - Model identifier
   * @param explicitProvider - Explicitly specified provider
   * @returns Provider instance or undefined
   */
  getProviderForModel(
    modelId: string,
    explicitProvider?: VideoRuntimeProvider,
  ): VideoProvider | undefined {
    // Use explicit provider if specified
    if (explicitProvider) {
      return this.providers.get(explicitProvider);
    }

    // Try to detect provider from model ID
    const detected = detectProviderFromModel(modelId);
    if (detected && this.providers.has(detected)) {
      return this.providers.get(detected);
    }

    // Fall back to default provider
    if (this.defaultProvider && this.providers.has(this.defaultProvider)) {
      return this.providers.get(this.defaultProvider);
    }

    return undefined;
  }

  /**
   * Generate a video with automatic provider routing.
   *
   * @param params - Generation parameters
   * @param options - Additional options
   * @param signal - Abort signal
   */
  async *generate(
    params: VideoGenerationParams,
    options?: { provider?: VideoRuntimeProvider },
    signal?: AbortSignal,
  ): AsyncGenerator<VideoStreamEvent> {
    const provider = this.getProviderForModel(params.model, options?.provider);

    if (!provider) {
      yield {
        type: 'error',
        error: VideoError.providerNotFound(`No provider found for model: ${params.model}`).toInfo(),
      };
      return;
    }

    yield* provider.generate(params, signal);
  }

  hasProvider(provider: VideoRuntimeProvider): boolean {
    return this.providers.has(provider);
  }

  getConfiguredProviders(): VideoRuntimeProvider[] {
    return Array.from(this.providers.keys());
  }

  addProvider(provider: VideoRuntimeProvider, config: VideoRuntimeConfig): void {
    const instance = videoProviderFactory.createProvider(provider, config);
    this.providers.set(provider, instance);
  }

  removeProvider(provider: VideoRuntimeProvider): boolean {
    return this.providers.delete(provider);
  }
}

export function createVideoRouter(options: VideoRouterOptions): VideoRouter {
  return new VideoRouter(options);
}
