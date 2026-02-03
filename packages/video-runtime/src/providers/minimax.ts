/**
 * MiniMax Hailuo Video Provider
 *
 * Direct API connection to MiniMax Hailuo video generation.
 *
 * API Reference:
 * - Create: POST /v1/video_generation
 * - Poll: GET /v1/query/video_generation?task_id=xxx
 */

import type {
  VideoGenerationParams,
  VideoGenerationResult,
  VideoProviderCapabilities,
  VideoRuntimeConfig,
  VideoTaskState,
  VideoTaskStatus,
} from '../types';
import { buildUrl, httpRequest, isImageToVideoInput, joinUrl, VideoError } from '../utils';
import { BaseVideoProvider, stripProviderPrefix } from './base';

/**
 * MiniMax video creation request body.
 */
interface MiniMaxVideoRequest {
  model: string;
  prompt: string;
  first_frame_image?: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  callback_url?: string;
}

/**
 * MiniMax video creation response.
 */
interface MiniMaxVideoCreateResponse {
  task_id: string;
  base_resp: {
    status_code: number;
    status_msg?: string;
  };
}

/**
 * MiniMax video query response.
 */
interface MiniMaxVideoQueryResponse {
  task_id: string;
  status: string;
  file_id?: string;
  base_resp: {
    status_code: number;
    status_msg?: string;
  };
}

/**
 * MiniMax file retrieve response.
 */
interface MiniMaxFileResponse {
  file: {
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
  };
  base_resp: {
    status_code: number;
    status_msg?: string;
  };
}

/**
 * Map MiniMax status to internal status.
 */
function mapStatus(status: string): VideoTaskStatus {
  switch (status.toLowerCase()) {
    case 'queueing':
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
 * Map aspect ratio to MiniMax format.
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
 * Map quality to resolution.
 */
function mapQualityToResolution(quality?: string): string | undefined {
  switch (quality) {
    case 'standard':
      return '720P';
    case 'high':
      return '1080P';
    case 'pro':
    case 'master':
      return '4K';
    default:
      return undefined;
  }
}

/**
 * MiniMax Hailuo video provider.
 */
export class MiniMaxVideoProvider extends BaseVideoProvider {
  readonly providerId = 'minimax' as const;
  readonly displayName = 'MiniMax Hailuo';
  readonly defaultBaseURL = 'https://api.minimax.chat/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: true,
    cameraMovement: true,
    maxDurationSeconds: 6,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    qualityTiers: ['standard', 'high'],
  };

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Map common names to MiniMax model IDs
    if (stripped === 'hailuo' || stripped === 'hailuo-2.3') {
      return 'video-01';
    }
    if (stripped.startsWith('hailuo-')) {
      return 'video-01';
    }
    return stripped;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...this.headers,
    };
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    const body: MiniMaxVideoRequest = {
      model,
      prompt: input.prompt,
      duration: params.duration,
      resolution: mapQualityToResolution(params.quality),
      aspect_ratio: mapAspectRatio(params.aspectRatio),
    };

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      if (input.image.url) {
        body.first_frame_image = input.image.url;
      } else if (input.image.base64) {
        body.first_frame_image = `data:${input.image.mediaType};base64,${input.image.base64}`;
      }
    }

    const response = await httpRequest<MiniMaxVideoCreateResponse>(
      joinUrl(this.baseURL, 'video_generation'),
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
        timeout: this.timeout,
        signal,
      },
    );

    // Check for API errors
    if (response.data.base_resp.status_code !== 0) {
      throw VideoError.providerError(
        response.data.base_resp.status_msg || 'MiniMax API error',
        this.providerId,
        response.data,
      );
    }

    if (!response.data.task_id) {
      throw VideoError.providerError(
        'No task ID returned from MiniMax',
        this.providerId,
        response.data,
      );
    }

    return response.data.task_id;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const url = buildUrl(joinUrl(this.baseURL, 'query/video_generation'), {
      task_id: taskId,
    });

    const response = await httpRequest<MiniMaxVideoQueryResponse>(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      signal,
    });

    const data = response.data;

    // Check for API errors
    if (data.base_resp.status_code !== 0) {
      return {
        taskId,
        status: 'failed',
        error: {
          code: 'PROVIDER_ERROR',
          message: data.base_resp.status_msg || 'MiniMax API error',
          provider: this.providerId,
          retryable: false,
        },
      };
    }

    const status = mapStatus(data.status);

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && data.file_id) {
      // Need to retrieve the file URL
      const videoUrl = await this.getFileUrl(data.file_id, signal);
      result = {
        url: videoUrl,
        mimeType: 'video/mp4',
      };
    }

    return {
      taskId,
      status,
      result,
    };
  }

  /**
   * Get the download URL for a file.
   */
  private async getFileUrl(fileId: string, signal?: AbortSignal): Promise<string> {
    const url = buildUrl(joinUrl(this.baseURL, 'files/retrieve'), {
      file_id: fileId,
    });

    const response = await httpRequest<MiniMaxFileResponse>(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      signal,
    });

    if (response.data.base_resp.status_code !== 0) {
      throw VideoError.providerError(
        response.data.base_resp.status_msg || 'Failed to retrieve file',
        this.providerId,
        response.data,
      );
    }

    return response.data.file.download_url;
  }
}

/**
 * Create a MiniMax video provider instance.
 */
export function createMiniMaxProvider(config: VideoRuntimeConfig): MiniMaxVideoProvider {
  return new MiniMaxVideoProvider(config);
}
