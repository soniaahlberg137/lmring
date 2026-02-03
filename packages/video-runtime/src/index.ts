/**
 * @lmring/video-runtime
 *
 * Multi-provider video generation API adapter.
 * Direct API connections to various video generation providers.
 *
 * @example
 * ```typescript
 * import { createVideoClient } from '@lmring/video-runtime';
 *
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
 *   switch (event.type) {
 *     case 'heartbeat':
 *       console.log('Still generating...');
 *       break;
 *     case 'progress':
 *       console.log(`Progress: ${event.progress}%`);
 *       break;
 *     case 'video':
 *       console.log('Video URL:', event.video.url);
 *       break;
 *     case 'error':
 *       console.error('Error:', event.error.message);
 *       break;
 *   }
 * }
 * ```
 */

// Core exports
export {
  type CreateVideoClientOptions,
  createVideoClient,
  createVideoClientFromProvider,
  createVideoRouter,
  detectProviderFromModel,
  VideoProviderFactory,
  VideoRouter,
  videoProviderFactory,
} from './core';
// Provider exports (for advanced usage)
export {
  BaseVideoProvider,
  createGoogleProvider,
  createKlingProvider,
  createMiniMaxProvider,
  createOpenAICompatibleProvider,
  createOpenAIProvider,
  createSeedanceProvider,
  createViduProvider,
  GoogleVideoProvider,
  KlingVideoProvider,
  MiniMaxVideoProvider,
  type OpenAICompatibleConfig,
  OpenAICompatibleVideoProvider,
  OpenAIVideoProvider,
  SeedanceVideoProvider,
  stripProviderPrefix,
  ViduVideoProvider,
} from './providers';
// Type exports
export type {
  ErrorEvent,
  HeartbeatEvent,
  ImageMedia,
  ImageToVideoInput,
  ProgressEvent,
  TaskBasedProvider,
  // Video types
  TextToVideoInput,
  // Provider types
  ValidationResult,
  VideoAspectRatio,
  VideoClient,
  VideoErrorCode,
  VideoErrorInfo,
  VideoEvent,
  VideoGenerationInput,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoProvider,
  VideoProviderCapabilities,
  VideoProviderFactory as VideoProviderFactoryInterface,
  VideoProviderOptions,
  VideoQuality,
  VideoRouter as VideoRouterInterface,
  VideoRouterOptions,
  VideoRuntimeConfig,
  // Config types
  VideoRuntimeProvider,
  VideoStreamEvent,
  VideoTaskState,
  VideoTaskStatus,
} from './types';
// Utility exports
export { getErrorInfo, isRetryableError, VideoError } from './utils';
