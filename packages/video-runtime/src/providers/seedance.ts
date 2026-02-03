/**
 * ByteDance Seedance Video Provider
 *
 * Direct API connection to ByteDance Seedance (Doubao) video generation via BytePlus ModelArk.
 *
 * API Reference:
 * - Create: POST /v1/videos/create
 * - Poll: GET /v1/videos/{task_id}
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
 * Seedance video creation request body.
 */
interface SeedanceVideoRequest {
  model: string;
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
}

/**
 * Seedance API response.
 */
interface SeedanceResponse {
  code: number;
  message: string;
  data?: {
    task_id: string;
    status?: string;
    video_url?: string;
    error_message?: string;
  };
}

/**
 * Map Seedance status to internal status.
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
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'processing';
  }
}

/**
 * Map aspect ratio to Seedance format.
 */
function mapAspectRatio(aspectRatio?: string): string | undefined {
  switch (aspectRatio) {
    case '16:9':
      return '16:9';
    case '9:16':
      return '9:16';
    case '1:1':
      return '1:1';
    case '4:3':
      return '4:3';
    case '3:4':
      return '3:4';
    default:
      return undefined;
  }
}

/**
 * ByteDance Seedance video provider.
 */
export class SeedanceVideoProvider extends BaseVideoProvider {
  readonly providerId = 'seedance' as const;
  readonly displayName = 'ByteDance Seedance';
  readonly defaultBaseURL = 'https://ark.cn-beijing.volces.com/api/v3';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: false,
    cameraMovement: false,
    maxDurationSeconds: 10,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    qualityTiers: ['standard', 'pro'],
  };

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Map common names to Seedance model IDs
    if (stripped === 'seedance' || stripped === 'seedance-1.0') {
      return 'seedance-1.0-pro';
    }
    return stripped;
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    const content: SeedanceVideoRequest['content'] = [{ type: 'text', text: input.prompt }];

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      let imageUrl: string;
      if (input.image.url) {
        imageUrl = input.image.url;
      } else if (input.image.base64) {
        imageUrl = `data:${input.image.mediaType};base64,${input.image.base64}`;
      } else {
        throw VideoError.invalidParams('Image URL or base64 required', this.providerId);
      }

      content.unshift({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    const body: SeedanceVideoRequest = {
      model,
      content,
      duration: params.duration,
      aspect_ratio: mapAspectRatio(params.aspectRatio),
    };

    const response = await httpRequest<SeedanceResponse>(
      joinUrl(this.baseURL, 'videos', 'create'),
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        timeout: this.timeout,
        signal,
      },
    );

    if (response.data.code !== 0 && response.data.code !== 200) {
      throw VideoError.providerError(
        response.data.message || 'Seedance API error',
        this.providerId,
        response.data,
      );
    }

    if (!response.data.data?.task_id) {
      throw VideoError.providerError(
        'No task ID returned from Seedance',
        this.providerId,
        response.data,
      );
    }

    return response.data.data.task_id;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const response = await httpRequest<SeedanceResponse>(joinUrl(this.baseURL, 'videos', taskId), {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      signal,
    });

    if (response.data.code !== 0 && response.data.code !== 200) {
      return {
        taskId,
        status: 'failed',
        error: {
          code: 'PROVIDER_ERROR',
          message: response.data.message || 'Seedance API error',
          provider: this.providerId,
          retryable: false,
        },
      };
    }

    const data = response.data.data;
    const status = mapStatus(data?.status || 'processing');

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && data?.video_url) {
      result = {
        url: data.video_url,
        mimeType: 'video/mp4',
      };
    }

    // Build error for failed status
    let error: VideoErrorInfo | undefined;
    if (status === 'failed') {
      error = {
        code: 'GENERATION_FAILED' as const,
        message: data?.error_message || 'Video generation failed',
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
 * Create a Seedance video provider instance.
 */
export function createSeedanceProvider(config: VideoRuntimeConfig): SeedanceVideoProvider {
  return new SeedanceVideoProvider(config);
}
