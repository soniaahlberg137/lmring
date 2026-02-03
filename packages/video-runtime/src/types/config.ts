/**
 * Video Runtime Provider Types
 *
 * Defines the supported video generation providers and their configurations.
 */

/**
 * Supported video generation providers.
 * Each provider has its own API format and authentication method.
 */
export type VideoRuntimeProvider =
  | 'openai' // OpenAI Sora
  | 'google' // Google Veo
  | 'minimax' // MiniMax Hailuo
  | 'kling' // Kling AI (Kuaishou)
  | 'seedance' // ByteDance Seedance
  | 'vidu' // Vidu
  | 'openai-compatible'; // Proxy services (LiteLLM, New-API)

/**
 * Configuration for a video runtime provider.
 */
export interface VideoRuntimeConfig {
  /** API key for authentication */
  apiKey: string;

  /** Custom base URL (overrides provider default) */
  baseURL?: string;

  /** Request timeout in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;

  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;

  /** Additional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Provider capabilities describing what features are supported.
 */
export interface VideoProviderCapabilities {
  /** Supports text-to-video generation */
  textToVideo: boolean;

  /** Supports image-to-video generation */
  imageToVideo: boolean;

  /** Supports start/end frame specification */
  startEndFrames: boolean;

  /** Supports native audio generation */
  audio: boolean;

  /** Supports camera movement instructions */
  cameraMovement: boolean;

  /** Maximum video duration in seconds */
  maxDurationSeconds: number;

  /** Supported aspect ratios */
  aspectRatios: string[];

  /** Supported quality tiers */
  qualityTiers: string[];
}
