/**
 * OpenAI-Compatible Video Provider
 *
 * Provider for OpenAI-compatible proxy services like LiteLLM and New-API.
 * Follows the OpenAI video API format with configurable base URL.
 *
 * API Reference (OpenAI-compatible):
 * - Create: POST /v1/videos or /v1/videos/generations
 * - Poll: GET /v1/videos/{id}
 */

import type {
  VideoErrorInfo,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoProviderCapabilities,
  VideoRuntimeConfig,
  VideoTaskState,
  VideoTaskStatus,
} from '../types';
import { httpRequest, isImageToVideoInput, joinUrl, VideoError } from '../utils';
import { BaseVideoProvider, stripProviderPrefix } from './base';

/**
 * Extended config for OpenAI-compatible providers.
 */
export interface OpenAICompatibleConfig extends VideoRuntimeConfig {
  /**
   * Use the /videos/generations endpoint instead of /videos.
   * Some proxies use this alternative endpoint format.
   */
  useGenerationsEndpoint?: boolean;
}

/**
 * OpenAI-compatible video request body.
 */
interface OpenAICompatibleVideoRequest {
  model: string;
  prompt: string;
  size?: string;
  seconds?: number;
  duration?: number;
  image_url?: string;
  image?: string;
  aspect_ratio?: string;
  n?: number;
}

/**
 * OpenAI-compatible video response.
 */
interface OpenAICompatibleVideoResponse {
  id?: string; // OpenAI standard format
  task_id?: string; // MiniMax/bltcy.ai format
  request_id?: string; // Alternative format
  status: string;
  model?: string;
  created_at?: number;
  video_url?: string;
  url?: string;
  output?: string; // Veo API format: direct output field
  data?: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
  progress?: number;
}

/**
 * Extract video URL from various response formats.
 * Handles: OpenAI array format, direct URL fields, and Veo output format.
 */
function extractVideoUrl(data: OpenAICompatibleVideoResponse): string | undefined {
  // OpenAI array format: data.data[0].url
  if (Array.isArray(data.data) && data.data[0]?.url) {
    return data.data[0].url;
  }
  // Veo nested format: data.data.output (when data.data is object, not array)
  if (data.data && !Array.isArray(data.data)) {
    const dataObj = data.data as { output?: string };
    if (dataObj.output) {
      return dataObj.output;
    }
  }
  // Direct fields
  return data.url || data.video_url || data.output;
}

/**
 * Map status to internal status.
 */
function mapStatus(status: string): VideoTaskStatus {
  switch (status?.toLowerCase()) {
    case 'queued':
    case 'pending':
      return 'queued';
    case 'processing':
    case 'in_progress':
    case 'running':
      return 'processing';
    case 'completed':
    case 'succeeded':
    case 'success':
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'processing';
  }
}

/**
 * Convert aspect ratio to size string.
 */
function aspectRatioToSize(
  aspectRatio?: string,
  width?: number,
  height?: number,
): string | undefined {
  if (width && height) {
    return `${width}x${height}`;
  }

  switch (aspectRatio) {
    case '16:9':
      return '1920x1080';
    case '9:16':
      return '1080x1920';
    case '1:1':
      return '1080x1080';
    case '4:3':
      return '1440x1080';
    case '3:4':
      return '1080x1440';
    default:
      return undefined;
  }
}

/**
 * OpenAI-compatible video provider for proxy services.
 */
export class OpenAICompatibleVideoProvider extends BaseVideoProvider {
  readonly providerId = 'openai-compatible' as const;
  readonly displayName = 'OpenAI Compatible';
  readonly defaultBaseURL = 'http://localhost:4000/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: false,
    cameraMovement: false,
    maxDurationSeconds: 60,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    qualityTiers: ['standard', 'high', 'pro'],
  };

  private readonly useGenerationsEndpoint: boolean;

  constructor(config: OpenAICompatibleConfig) {
    super(config);
    // Default to true for better compatibility with proxy services like bltcy.ai
    this.useGenerationsEndpoint = config.useGenerationsEndpoint ?? true;
  }

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);

    // Map Google official model names to third-party proxy formats (e.g., bltcy.ai)
    // Google uses: veo-X.Y-fast-generate-001, veo-X.Y-generate-001
    // Proxies use: veoX.Y-fast, veoX.Y
    const modelMapping: Record<string, string> = {
      // Veo 3.1
      'veo-3.1-generate-001': 'veo3.1',
      'veo-3.1-fast-generate-001': 'veo3.1-fast',
      'veo-3.1-pro-generate-001': 'veo3.1-pro',
      // Veo 3.0
      'veo-3.0-generate-001': 'veo3',
      'veo-3.0-fast-generate-001': 'veo3-fast',
      // Veo 2.0
      'veo-2.0-generate-001': 'veo2',
      'veo-2.0-fast-generate-001': 'veo2-fast',
    };

    return modelMapping[stripped] || stripped;
  }

  /**
   * Get the endpoint path for video creation.
   */
  private get createEndpoint(): string {
    return this.useGenerationsEndpoint ? 'videos/generations' : 'videos';
  }

  /**
   * Get the endpoint path for polling status.
   */
  private get pollEndpoint(): string {
    // Match the create endpoint pattern for consistency
    return this.useGenerationsEndpoint ? 'videos/generations' : 'videos';
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    const body: OpenAICompatibleVideoRequest = {
      model,
      prompt: input.prompt,
      size: aspectRatioToSize(params.aspectRatio, params.width, params.height),
      seconds: params.duration,
      duration: params.duration,
      aspect_ratio: params.aspectRatio,
    };

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      if (input.image.url) {
        body.image_url = input.image.url;
        body.image = input.image.url;
      } else if (input.image.base64) {
        const dataUrl = `data:${input.image.mediaType};base64,${input.image.base64}`;
        body.image_url = dataUrl;
        body.image = dataUrl;
      }
    }

    const response = await httpRequest<OpenAICompatibleVideoResponse>(
      joinUrl(this.baseURL, this.createEndpoint),
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        timeout: this.timeout,
        signal,
      },
    );

    // Handle direct completion (some proxies return immediately)
    if (extractVideoUrl(response.data)) {
      // Store the result and return a synthetic ID
      return `direct:${JSON.stringify(response.data)}`;
    }

    // Extract task ID from multiple possible field names
    const taskId = response.data.id || response.data.task_id || response.data.request_id;

    if (!taskId) {
      throw VideoError.providerError(
        response.data.error?.message || 'No task ID returned',
        this.providerId,
        response.data,
      );
    }

    return taskId;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    // Handle direct completion
    if (taskId.startsWith('direct:')) {
      const data = JSON.parse(taskId.slice(7)) as OpenAICompatibleVideoResponse;
      const videoUrl = extractVideoUrl(data);

      return {
        taskId,
        status: 'completed',
        result: videoUrl
          ? {
              url: videoUrl,
              mimeType: 'video/mp4',
            }
          : undefined,
      };
    }

    // URL-encode the task ID to handle special characters like ':'
    const encodedTaskId = encodeURIComponent(taskId);

    const response = await httpRequest<OpenAICompatibleVideoResponse>(
      joinUrl(this.baseURL, this.pollEndpoint, encodedTaskId),
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
        signal,
      },
    );

    const data = response.data;
    const status = mapStatus(data.status);

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    const videoUrl = extractVideoUrl(data);
    if (status === 'completed' && videoUrl) {
      result = {
        url: videoUrl,
        mimeType: 'video/mp4',
      };
    }

    // Build error for failed status
    let error: VideoErrorInfo | undefined;
    if (status === 'failed' && data.error) {
      error = {
        code: 'GENERATION_FAILED' as const,
        message: data.error.message || 'Video generation failed',
        provider: this.providerId,
        retryable: false,
      };
    }

    return {
      taskId,
      status,
      progress: data.progress,
      result,
      error,
    };
  }
}

/**
 * Create an OpenAI-compatible video provider instance.
 */
export function createOpenAICompatibleProvider(
  config: OpenAICompatibleConfig,
): OpenAICompatibleVideoProvider {
  return new OpenAICompatibleVideoProvider(config);
}
