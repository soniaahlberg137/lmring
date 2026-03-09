/**
 * Video Provider Factory
 *
 * Creates and caches video provider instances based on configuration.
 */

import { DashScopeVideoProvider } from '../providers/dashscope';
import { GoogleVideoProvider } from '../providers/google';
import { KlingVideoProvider } from '../providers/kling';
import { MiniMaxVideoProvider } from '../providers/minimax';
import { OpenAIVideoProvider } from '../providers/openai';
import {
  type OpenAICompatibleConfig,
  OpenAICompatibleVideoProvider,
} from '../providers/openai-compatible';
import { SeedanceVideoProvider } from '../providers/seedance';
import { ViduVideoProvider } from '../providers/vidu';
import type { VideoProvider, VideoRuntimeConfig, VideoRuntimeProvider } from '../types';
import { VideoError } from '../utils';

/**
 * Factory for creating video provider instances.
 */
export class VideoProviderFactory {
  private readonly cache = new Map<string, VideoProvider>();

  /**
   * Create or retrieve a cached video provider instance.
   *
   * @param provider - Provider type
   * @param config - Provider configuration
   * @returns Video provider instance
   */
  createProvider(provider: VideoRuntimeProvider, config: VideoRuntimeConfig): VideoProvider {
    // Generate cache key from provider and baseURL
    const cacheKey = `${provider}:${config.baseURL ?? 'default'}`;

    // Return cached instance if available
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Create new instance
    const instance = this.instantiateProvider(provider, config);
    this.cache.set(cacheKey, instance);

    return instance;
  }

  /**
   * Create a new provider instance without caching.
   */
  private instantiateProvider(
    provider: VideoRuntimeProvider,
    config: VideoRuntimeConfig,
  ): VideoProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIVideoProvider(config);

      case 'minimax':
        return new MiniMaxVideoProvider(config);

      case 'google':
        return new GoogleVideoProvider(config);

      case 'kling':
        return new KlingVideoProvider(config);

      case 'seedance':
        return new SeedanceVideoProvider(config);

      case 'vidu':
        return new ViduVideoProvider(config);

      case 'dashscope':
        return new DashScopeVideoProvider(config);

      case 'openai-compatible':
        return new OpenAICompatibleVideoProvider(config as OpenAICompatibleConfig);

      default:
        throw VideoError.providerNotFound(provider);
    }
  }

  isSupported(provider: VideoRuntimeProvider): boolean {
    const supportedProviders: VideoRuntimeProvider[] = [
      'openai',
      'minimax',
      'google',
      'kling',
      'seedance',
      'vidu',
      'dashscope',
      'openai-compatible',
    ];
    return supportedProviders.includes(provider);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getSupportedProviders(): VideoRuntimeProvider[] {
    return [
      'openai',
      'minimax',
      'google',
      'kling',
      'seedance',
      'vidu',
      'dashscope',
      'openai-compatible',
    ];
  }
}

export const videoProviderFactory = new VideoProviderFactory();
