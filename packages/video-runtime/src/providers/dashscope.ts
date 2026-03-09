/**
 * DashScope (Aliyun Bailian) Video Provider
 *
 * API Reference:
 * - Create: POST /services/aigc/video-generation/video-synthesis
 * - Poll: GET /tasks/{task_id}
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

interface DashScopeCreateResponse {
  output: {
    task_status: string;
    task_id: string;
  };
  request_id: string;
}

interface DashScopeTaskResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: string;
    task_metrics?: {
      TOTAL?: number;
      SUCCEEDED?: number;
      FAILED?: number;
    };
    video_url?: string;
    submit_time?: string;
    scheduled_time?: string;
    end_time?: string;
    code?: string;
    message?: string;
  };
}

function mapStatus(status: string): VideoTaskStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'queued';
    case 'RUNNING':
      return 'processing';
    case 'SUCCEEDED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'processing';
  }
}

function mapSizeToResolution(aspectRatio?: string): string {
  switch (aspectRatio) {
    case '16:9':
      return '1280*720';
    case '9:16':
      return '720*1280';
    case '1:1':
      return '960*960';
    default:
      return '1280*720';
  }
}

function mapResolutionTier(_aspectRatio?: string, quality?: string): string {
  if (quality === 'high') return '1080P';
  return '720P';
}

export class DashScopeVideoProvider extends BaseVideoProvider {
  readonly providerId = 'dashscope' as const;
  readonly displayName = 'DashScope';
  readonly defaultBaseURL = 'https://dashscope.aliyuncs.com/api/v1';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: true,
    cameraMovement: false,
    maxDurationSeconds: 15,
    aspectRatios: ['16:9', '9:16', '1:1'],
    qualityTiers: ['standard', 'high'],
  };

  resolveModelId(modelId: string): string {
    return stripProviderPrefix(modelId);
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;
    const isI2V = isImageToVideoInput(input);

    const requestInput: Record<string, unknown> = {
      prompt: input.prompt,
    };

    if (input.negativePrompt) {
      requestInput.negative_prompt = input.negativePrompt;
    }

    if (isI2V) {
      if (input.image.url) {
        requestInput.img_url = input.image.url;
      } else if (input.image.base64) {
        requestInput.img_url = `data:${input.image.mediaType};base64,${input.image.base64}`;
      } else {
        throw VideoError.invalidParams('Image URL or base64 required', this.providerId);
      }
    }

    const parameters: Record<string, unknown> = {
      prompt_extend: true,
    };

    if (params.duration) {
      parameters.duration = params.duration;
    }

    if (isI2V) {
      parameters.resolution = mapResolutionTier(params.aspectRatio, params.quality);
    } else {
      parameters.size = mapSizeToResolution(params.aspectRatio);
    }

    const body = {
      model,
      input: requestInput,
      parameters,
    };

    const headers = {
      ...this.getAuthHeaders(),
      'X-DashScope-Async': 'enable',
    };

    const response = await httpRequest<DashScopeCreateResponse>(
      joinUrl(this.baseURL, 'services/aigc/video-generation/video-synthesis'),
      {
        method: 'POST',
        headers,
        body,
        timeout: this.timeout,
        signal,
      },
    );

    const taskId = response.data.output?.task_id;
    if (!taskId) {
      throw VideoError.providerError(
        'No task ID returned from DashScope',
        this.providerId,
        response.data,
      );
    }

    return taskId;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    const response = await httpRequest<DashScopeTaskResponse>(
      joinUrl(this.baseURL, 'tasks', taskId),
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
        signal,
      },
    );

    const output = response.data.output;
    const status = mapStatus(output.task_status);

    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && output.video_url) {
      result = {
        url: output.video_url,
        mimeType: 'video/mp4',
      };
    }

    let error: VideoErrorInfo | undefined;
    if (status === 'failed') {
      error = {
        code: 'GENERATION_FAILED' as const,
        message: output.message || 'Video generation failed',
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

export function createDashScopeProvider(config: VideoRuntimeConfig): DashScopeVideoProvider {
  return new DashScopeVideoProvider(config);
}
