/**
 * Google Veo Video Provider
 *
 * Direct API connection to Google Veo video generation via Gemini API.
 *
 * API Reference:
 * - Create: POST /v1beta/models/{model}:generateContent
 * - Poll: GET /v1beta/operations/{name}
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
import { buildUrl, httpRequest, isImageToVideoInput, joinUrl, VideoError } from '../utils';
import { BaseVideoProvider, stripProviderPrefix } from './base';

/**
 * Gemini content part.
 */
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
}

/**
 * Gemini generate content request.
 */
interface GeminiGenerateRequest {
  contents: Array<{
    parts: GeminiPart[];
  }>;
  generationConfig?: {
    responseModalities?: string[];
    videoDuration?: string;
    aspectRatio?: string;
  };
}

/**
 * Gemini operation response (for async operations).
 */
interface GeminiOperationResponse {
  name: string;
  done: boolean;
  error?: {
    code: number;
    message: string;
  };
  metadata?: {
    '@type': string;
  };
  response?: {
    '@type': string;
    candidates?: Array<{
      content: {
        parts: Array<{
          fileData?: {
            mimeType: string;
            fileUri: string;
          };
          videoMetadata?: {
            videoDuration: string;
          };
        }>;
      };
    }>;
  };
}

/**
 * Map Google operation status to internal status.
 */
function mapOperationStatus(op: GeminiOperationResponse): VideoTaskStatus {
  if (op.error) {
    return 'failed';
  }
  if (op.done) {
    return 'completed';
  }
  return 'processing';
}

/**
 * Map aspect ratio to Google format.
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
 * Google Veo video provider.
 */
export class GoogleVideoProvider extends BaseVideoProvider {
  readonly providerId = 'google' as const;
  readonly displayName = 'Google Veo';
  readonly defaultBaseURL = 'https://generativelanguage.googleapis.com/v1beta';

  readonly capabilities: VideoProviderCapabilities = {
    textToVideo: true,
    imageToVideo: true,
    startEndFrames: false,
    audio: true,
    cameraMovement: false,
    maxDurationSeconds: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    qualityTiers: ['standard', 'high'],
  };

  /**
   * Get auth headers - Google uses API key in query param.
   */
  protected getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.headers,
    };
  }

  /**
   * Build URL with API key.
   */
  private buildUrlWithKey(path: string): string {
    return buildUrl(joinUrl(this.baseURL, path), { key: this.apiKey });
  }

  resolveModelId(modelId: string): string {
    const stripped = stripProviderPrefix(modelId);
    // Map common names to Google model IDs
    if (stripped === 'veo' || stripped === 'veo-3' || stripped === 'veo-3.0') {
      return 'veo-2.0-generate-001';
    }
    if (stripped === 'veo-2' || stripped === 'veo-2.0') {
      return 'veo-2.0-generate-001';
    }
    return stripped;
  }

  protected async createTask(params: VideoGenerationParams, signal?: AbortSignal): Promise<string> {
    const model = this.resolveModelId(params.model);
    const input = params.input;

    // Build content parts
    const parts: GeminiPart[] = [{ text: input.prompt }];

    // Add image for I2V
    if (isImageToVideoInput(input)) {
      if (input.image.base64) {
        parts.unshift({
          inlineData: {
            mimeType: input.image.mediaType,
            data: input.image.base64,
          },
        });
      } else if (input.image.url) {
        parts.unshift({
          fileData: {
            mimeType: input.image.mediaType,
            fileUri: input.image.url,
          },
        });
      }
    }

    const body: GeminiGenerateRequest = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['VIDEO'],
        videoDuration: params.duration ? `${params.duration}s` : undefined,
        aspectRatio: mapAspectRatio(params.aspectRatio),
      },
    };

    const url = this.buildUrlWithKey(`models/${model}:generateContent`);

    const response = await httpRequest<GeminiOperationResponse>(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body,
      timeout: this.timeout,
      signal,
    });

    // Google returns an operation for async video generation
    if (!response.data.name) {
      // Might be a sync response (unlikely for video)
      if (response.data.done && response.data.response) {
        return 'sync-completed';
      }
      throw VideoError.providerError(
        'No operation name returned from Google',
        this.providerId,
        response.data,
      );
    }

    return response.data.name;
  }

  protected async pollTaskStatus(taskId: string, signal?: AbortSignal): Promise<VideoTaskState> {
    // Handle sync completion
    if (taskId === 'sync-completed') {
      return {
        taskId,
        status: 'completed',
        result: undefined, // Would need to store from createTask
      };
    }

    const url = this.buildUrlWithKey(taskId);

    const response = await httpRequest<GeminiOperationResponse>(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      signal,
    });

    const data = response.data;
    const status = mapOperationStatus(data);

    // Build result for completed status
    let result: VideoGenerationResult | undefined;
    if (status === 'completed' && data.response?.candidates?.[0]) {
      const candidate = data.response.candidates[0];
      const videoPart = candidate.content.parts.find((p) => p.fileData);

      if (videoPart?.fileData) {
        result = {
          url: videoPart.fileData.fileUri,
          mimeType: videoPart.fileData.mimeType || 'video/mp4',
        };
      }
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
 * Create a Google video provider instance.
 */
export function createGoogleProvider(config: VideoRuntimeConfig): GoogleVideoProvider {
  return new GoogleVideoProvider(config);
}
