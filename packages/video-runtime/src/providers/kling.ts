/**
 * Kling AI Video Provider
 *
 * Direct API connection to Kling (Kuaishou) video generation.
 *
 * API Reference:
 * - Create: POST /v1/videos/text2video or /v1/videos/image2video
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
 * Kling video creation request body (T2V).
 */
interface KlingT2VRequest {
  model_name: string;
  prompt: string;
  negative_prompt?: string;
  cfg_scale?: number;
  mode?: string;
  aspect_ratio?: string;
  duration?: string;
}

/**
 * Kling video creation request body (I2V).
 */
interface KlingI2VRequest {
  model_name: string;
  prompt: string;
  negative_prompt?: string;
  image: string;
  image_tail?: string;
  cfg_scale?: number;
  mode?: string;
  duration?: string;
}

/**
 * Kling API response wrapper.
 */
interface KlingResponse<T> {
  code: number;
  message: string;
  request_id: string;
  data: T;
}

/**
 * Kling task creation response data.
 */
interface KlingCreateData {
  task_id: string;
}

/**
 * Kling task query response data.
 */
interface KlingTaskData {
  task_id: string;
  task_status: string;
  task_status_msg?: string;
  task_result?: {
    videos: Array<{
      id: string;
      url: string;
      duration: string;
    }>;
  };
}

/**
 * Map Kling status to internal status.
 */
function mapStatus(status: string): VideoTaskStatus {
  switch (status.toLowerCase()) {
    case 'submitted':
    case 'pending':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'succeed':
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'processing';
  }
}

/**
 * Map aspect ratio to Kling format.
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
    case '21:9':
      return '21:9';
    default:
      return undefined;
  }
}

/**
 * Kling AI video provider.
 */
export class KlingVideoProvider extends BaseVideoProvider {
  readonly providerId = 'kling' as const;
  readonly displayName = 'Kling AI';
  readonly defaultBaseURL = 'https://api.klingai.com/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: true,
    audio: false,
    cameraMovement: true,
    maxDurationSeconds: 10,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
    qualityTiers: ['standard', 'pro'],
  };

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Map common names to Kling model IDs
    if (stripped === 'kling' || stripped === 'kling-v2') {
      return 'kling-v2-master';
    }
    if (stripped.startsWith('kling-')) {
      return stripped;
    }
    return stripped;
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;
    const isI2V = isImageToVideoInput(input);

    const endpoint = isI2V ? 'videos/image2video' : 'videos/text2video';

    let body: KlingT2VRequest | KlingI2VRequest;

    if (isI2V) {
      let imageData: string;
      if (input.image.url) {
        imageData = input.image.url;
      } else if (input.image.base64) {
        imageData = `data:${input.image.mediaType};base64,${input.image.base64}`;
      } else {
        throw VideoError.invalidParams('Image URL or base64 required', this.providerId);
      }

      body = {
        model_name: model,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt,
        image: imageData,
        duration: params.duration?.toString(),
        mode: params.quality === 'pro' ? 'pro' : 'std',
      } satisfies KlingI2VRequest;
    } else {
      body = {
        model_name: model,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt,
        aspect_ratio: mapAspectRatio(params.aspectRatio),
        duration: params.duration?.toString(),
        mode: params.quality === 'pro' ? 'pro' : 'std',
      } satisfies KlingT2VRequest;
    }

    const response = await httpRequest<KlingResponse<KlingCreateData>>(
      joinUrl(this.baseURL, endpoint),
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        timeout: this.timeout,
        signal,
      },
    );

    if (response.data.code !== 0) {
      throw VideoError.providerError(
        response.data.message || 'Kling API error',
        this.providerId,
        response.data,
      );
    }

    if (!response.data.data?.task_id) {
      throw VideoError.providerError(
        'No task ID returned from Kling',
        this.providerId,
        response.data,
      );
    }

    return response.data.data.task_id;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const response = await httpRequest<KlingResponse<KlingTaskData>>(
      joinUrl(this.baseURL, 'videos', taskId),
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
        signal,
      },
    );

    if (response.data.code !== 0) {
      return {
        taskId,
        status: 'failed',
        error: {
          code: 'PROVIDER_ERROR',
          message: response.data.message || 'Kling API error',
          provider: this.providerId,
          retryable: false,
        },
      };
    }

    const data = response.data.data;
    const status = mapStatus(data.task_status);

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && data.task_result?.videos?.[0]) {
      const video = data.task_result.videos[0];
      result = {
        url: video.url,
        mimeType: 'video/mp4',
        duration: Number.parseFloat(video.duration) || undefined,
      };
    }

    // Build error for failed status
    let error: VideoErrorInfo | undefined;
    if (status === 'failed') {
      error = {
        code: 'GENERATION_FAILED' as const,
        message: data.task_status_msg || 'Video generation failed',
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
 * Create a Kling video provider instance.
 */
export function createKlingProvider(config: VideoRuntimeConfig): KlingVideoProvider {
  return new KlingVideoProvider(config);
}
