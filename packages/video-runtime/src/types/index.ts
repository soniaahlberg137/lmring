/**
 * Video Runtime Types
 *
 * Central export for all video runtime type definitions.
 */

// Configuration types
export type {
  VideoProviderCapabilities,
  VideoRuntimeConfig,
  VideoRuntimeProvider,
} from './config';
// Provider interface types
export type {
  TaskBasedProvider,
  ValidationResult,
  VideoClient,
  VideoProvider,
  VideoProviderFactory,
  VideoProviderOptions,
  VideoRouter,
  VideoRouterOptions,
} from './provider';
// Video generation types
export type {
  ErrorEvent,
  HeartbeatEvent,
  ImageMedia,
  ImageToVideoInput,
  ProgressEvent,
  TextToVideoInput,
  VideoAspectRatio,
  VideoErrorCode,
  VideoErrorInfo,
  VideoEvent,
  VideoGenerationInput,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoQuality,
  VideoStreamEvent,
  VideoTaskState,
  VideoTaskStatus,
} from './video';
