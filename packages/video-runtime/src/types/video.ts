/**
 * Video Generation Types
 *
 * Core types for video generation inputs, outputs, and streaming events.
 * Supports T2V (Text-to-Video) and I2V (Image-to-Video) generation modes.
 */

// ============================================================================
// Input Types
// ============================================================================

/**
 * Text-to-Video generation input.
 */
export interface TextToVideoInput {
  type: 'text-to-video';
  /** The prompt describing the video to generate */
  prompt: string;
  /** Optional negative prompt to guide what to avoid */
  negativePrompt?: string;
}

/**
 * Image media input for I2V generation.
 */
export interface ImageMedia {
  /** URL of the image (mutually exclusive with base64) */
  url?: string;
  /** Base64-encoded image data (mutually exclusive with url) */
  base64?: string;
  /** MIME type of the image */
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp';
}

/**
 * Image-to-Video generation input.
 */
export interface ImageToVideoInput {
  type: 'image-to-video';
  /** The prompt describing the video motion/transformation */
  prompt: string;
  /** Optional negative prompt to guide what to avoid */
  negativePrompt?: string;
  /** The source image to animate */
  image: ImageMedia;
}

/**
 * Union type for all video generation inputs.
 */
export type VideoGenerationInput = TextToVideoInput | ImageToVideoInput;

// ============================================================================
// Generation Parameters
// ============================================================================

/**
 * Aspect ratio options for video generation.
 */
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

/**
 * Quality tier options for video generation.
 */
export type VideoQuality = 'standard' | 'high' | 'pro' | 'master';

/**
 * Parameters for video generation.
 */
export interface VideoGenerationParams {
  /** Model identifier (e.g., 'openai/sora-2', 'minimax/hailuo-2.3') */
  model: string;
  /** Generation input (T2V or I2V) */
  input: VideoGenerationInput;
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Aspect ratio (alternative to width/height) */
  aspectRatio?: VideoAspectRatio;
  /** Video duration in seconds */
  duration?: number;
  /** Frames per second */
  fps?: number;
  /** Quality tier */
  quality?: VideoQuality;
  /** Whether to generate audio (provider-dependent) */
  audio?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
  /** Provider-specific options */
  providerOptions?: Record<string, unknown>;
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * Result of a successful video generation.
 */
export interface VideoGenerationResult {
  /** URL to the generated video */
  url: string;
  /** MIME type of the video */
  mimeType: string;
  /** URL to a thumbnail image */
  thumbnailUrl?: string;
  /** Duration of the generated video in seconds */
  duration?: number;
  /** Width of the video in pixels */
  width?: number;
  /** Height of the video in pixels */
  height?: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for video generation failures.
 */
export type VideoErrorCode =
  | 'INVALID_PARAMS'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'CONTENT_POLICY'
  | 'INSUFFICIENT_CREDITS'
  | 'MODEL_NOT_FOUND'
  | 'PROVIDER_NOT_FOUND'
  | 'GENERATION_FAILED'
  | 'POLL_TIMEOUT'
  | 'UNKNOWN';

/**
 * Error information for video generation failures.
 */
export interface VideoErrorInfo {
  /** Error code for programmatic handling */
  code: VideoErrorCode;
  /** Human-readable error message */
  message: string;
  /** Provider that generated the error */
  provider?: string;
  /** Model that was being used */
  model?: string;
  /** Whether the operation can be retried */
  retryable?: boolean;
  /** Original error details from the provider */
  cause?: unknown;
}

// ============================================================================
// Streaming Event Types
// ============================================================================

/**
 * Heartbeat event to indicate the generation is still in progress.
 */
export interface HeartbeatEvent {
  type: 'heartbeat';
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Progress event with generation progress information.
 */
export interface ProgressEvent {
  type: 'progress';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current processing stage description */
  stage?: string;
}

/**
 * Video completion event with the generated video.
 */
export interface VideoEvent {
  type: 'video';
  /** The generated video result */
  video: VideoGenerationResult;
}

/**
 * Error event when generation fails.
 */
export interface ErrorEvent {
  type: 'error';
  /** Error information */
  error: VideoErrorInfo;
}

/**
 * Union type for all streaming events.
 */
export type VideoStreamEvent = HeartbeatEvent | ProgressEvent | VideoEvent | ErrorEvent;

// ============================================================================
// Task Status Types (for polling)
// ============================================================================

/**
 * Status of a video generation task.
 */
export type VideoTaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Video generation task state (for polling).
 */
export interface VideoTaskState {
  /** Task ID from the provider */
  taskId: string;
  /** Current status */
  status: VideoTaskStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Current processing stage */
  stage?: string;
  /** Result when completed */
  result?: VideoGenerationResult;
  /** Error when failed */
  error?: VideoErrorInfo;
}
