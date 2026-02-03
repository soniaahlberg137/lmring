/**
 * Vidu Video Provider
 *
 * Direct API connection to Vidu video generation.
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
 * Vidu video creation request body.
 */
interface ViduVideoRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  image?: string;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
  style?: string;
}

/**
 * Vidu API response.
 */
interface ViduResponse {
  id: string;
  status: string;
  model?: string;
  created_at?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Map Vidu status to internal status.
 */
function mapStatus(status: string): VideoTaskStatus {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'queued':
      return 'queued';
    case 'processing':
    case 'running':
      return 'processing';
    case 'success':
    case 'completed':
    case 'done':
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
 * Map aspect ratio to Vidu format.
 */
function mapAspectRatio(aspectRatio?: string): string | undefined {
  switch (aspectRatio) {
    case '16:9':
      return '16:9';
    case '9:16':
      return '9:16';
    case '1:1':
      return '1:1';
    default:
      return undefined;
  }
}

/**
 * Vidu video provider.
 */
export class ViduVideoProvider extends BaseVideoProvider {
  readonly providerId = 'vidu' as const;
  readonly displayName = 'Vidu';
  readonly defaultBaseURL = 'https://api.vidu.studio/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: false,
    cameraMovement: false,
    maxDurationSeconds: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    qualityTiers: ['standard', 'high'],
  };

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Map common names to Vidu model IDs
    if (stripped === 'vidu' || stripped === 'vidu-2' || stripped === 'vidu-2.0') {
      return 'vidu-2.0';
    }
    if (stripped === 'vidu-1' || stripped === 'vidu-1.5') {
      return 'vidu-1.5';
    }
    return stripped;
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    const body: ViduVideoRequest = {
      model,
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      duration: params.duration,
      aspect_ratio: mapAspectRatio(params.aspectRatio),
    };

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      if (input.image.url) {
        body.image = input.image.url;
      } else if (input.image.base64) {
        body.image = `data:${input.image.mediaType};base64,${input.image.base64}`;
      }
    }

    const response = await httpRequest<ViduResponse>(joinUrl(this.baseURL, 'videos'), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body,
      timeout: this.timeout,
      signal,
    });

    if (!response.data.id) {
      throw VideoError.providerError(
        response.data.error?.message || 'No task ID returned from Vidu',
        this.providerId,
        response.data,
      );
    }

    return response.data.id;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const response = await httpRequest<ViduResponse>(joinUrl(this.baseURL, 'videos', taskId), {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      signal,
    });

    const data = response.data;
    const status = mapStatus(data.status);

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && data.video_url) {
      result = {
        url: data.video_url,
        mimeType: 'video/mp4',
        thumbnailUrl: data.thumbnail_url,
        duration: data.duration,
        width: data.width,
        height: data.height,
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
      result,
      error,
    };
  }
}

/**
 * Create a Vidu video provider instance.
 */
export function createViduProvider(config: VideoRuntimeConfig): ViduVideoProvider {
  return new ViduVideoProvider(config);
}
