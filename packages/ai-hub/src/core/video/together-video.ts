import Together from 'together-ai';
import type {
  VideoGenerationParams,
  VideoGenerationResult,
  VideoStreamEvent,
} from '../../types/runtime';

export interface VideoGenerationConfig {
  apiKey: string;
  baseURL?: string;
}

interface TogetherVideoJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  outputs?: {
    video_url?: string;
    cost?: number;
  };
}

/**
 * Generate a video using Together AI's video generation API.
 * Yields heartbeat events while polling for completion.
 *
 * @param config - Configuration including API key and optional base URL
 * @param params - Video generation parameters
 * @param signal - Optional abort signal for cancellation
 */
export async function* generateVideo(
  config: VideoGenerationConfig,
  params: VideoGenerationParams,
  signal?: AbortSignal,
): AsyncGenerator<VideoStreamEvent> {
  const together = new Together({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  // Create video generation job
  const job = (await together.videos.create({
    model: params.model,
    prompt: params.prompt,
    width: params.width,
    height: params.height,
    seconds: params.duration?.toString(),
  })) as TogetherVideoJob;

  // Poll with heartbeats
  const pollInterval = 2000;
  const maxWaitTime = 300000; // 5 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    if (signal?.aborted) {
      yield { type: 'error', error: 'Video generation cancelled' };
      return;
    }

    yield { type: 'heartbeat' };

    // Check job status
    const status = (await together.videos.retrieve(job.id)) as TogetherVideoJob;

    if (status.status === 'completed' && status.outputs?.video_url) {
      const result: VideoGenerationResult = {
        url: status.outputs.video_url,
        mimeType: 'video/mp4',
        duration: params.duration,
      };
      yield { type: 'video', video: result };
      return;
    }

    if (status.status === 'failed') {
      yield { type: 'error', error: 'Video generation failed' };
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  yield { type: 'error', error: 'Video generation timed out' };
}
