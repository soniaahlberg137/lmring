/**
 * OpenAI Sora Video Provider
 *
 * Direct API connection to OpenAI Sora video generation.
 *
 * API Reference:
 * - Create: POST /v1/videos
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
 * OpenAI video creation request body.
 */
interface OpenAIVideoRequest {
  model: string;
  prompt: string;
  size?: string;
  seconds?: number;
  image_url?: string;
  n?: number;
}

/**
 * OpenAI video response.
 */
interface OpenAIVideoResponse {
  id: string;
  status: string;
  model: string;
  created_at?: number;
  video_url?: string;
  error?: {
    code: string;
    message: string;
  };
  progress?: number;
}

/**
 * Map OpenAI status to internal status.
 */
function mapStatus(status: string): VideoTaskStatus {
  switch (status.toLowerCase()) {
    case 'queued':
    case 'pending':
      return 'queued';
    case 'processing':
    case 'in_progress':
      return 'processing';
    case 'completed':
    case 'succeeded':
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
  // If explicit dimensions provided, use them
  if (width && height) {
    return `${width}x${height}`;
  }

  // Map aspect ratios to default sizes
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
    case '21:9':
      return '2560x1080';
    default:
      return undefined;
  }
}

/**
 * OpenAI Sora video provider.
 */
export class OpenAIVideoProvider extends BaseVideoProvider {
  readonly providerId = 'openai' as const;
  readonly displayName = 'OpenAI Sora';
  readonly defaultBaseURL = 'https://api.openai.com/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: false,
    cameraMovement: false,
    maxDurationSeconds: 20,
    aspectRatios: ['16:9', '9:16', '1:1'],
    qualityTiers: ['standard', 'high'],
  };

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Default to sora-2 if just 'sora' is provided
    if (stripped === 'sora') {
      return 'sora-2';
    }
    return stripped;
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    const body: OpenAIVideoRequest = {
      model,
      prompt: input.prompt,
      size: aspectRatioToSize(params.aspectRatio, params.width, params.height),
      seconds: params.duration,
    };

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      if (input.image.url) {
        body.image_url = input.image.url;
      } else if (input.image.base64) {
        body.image_url = `data:${input.image.mediaType};base64,${input.image.base64}`;
      }
    }

    const response = await httpRequest<OpenAIVideoResponse>(joinUrl(this.baseURL, 'videos'), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body,
      timeout: this.timeout,
      signal,
    });

    if (!response.data.id) {
      throw VideoError.providerError(
        'No task ID returned from OpenAI',
        this.providerId,
        response.data,
      );
    }

    return response.data.id;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const response = await httpRequest<OpenAIVideoResponse>(
      joinUrl(this.baseURL, 'videos', taskId),
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
    if (status === 'completed' && data.video_url) {
      result = {
        url: data.video_url,
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
 * Create an OpenAI video provider instance.
 */
export function createOpenAIProvider(config: VideoRuntimeConfig): OpenAIVideoProvider {
  return new OpenAIVideoProvider(config);
}
