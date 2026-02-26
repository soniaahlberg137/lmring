import { generateVideo } from '@lmring/ai-hub';
import { getRuntimeModelId, getRuntimeProvider } from '@lmring/model-depot/utils';
import { createStorageService } from '@lmring/storage';
import type { VideoRuntimeProvider } from '@lmring/video-runtime';
import { z } from 'zod';
import { auth } from '@/libs/Auth';
import { extractApiErrorMessage } from '@/libs/api-error-utils';
import { logError } from '@/libs/error-logging';
import { fetchUserApiKeys } from '@/libs/provider-factory';

const videoStreamSchema = z.object({
  workflowId: z.uuid('Invalid workflow ID'),
  modelId: z
    .string()
    .min(1)
    .max(200)
    .refine((val) => val.trim().length > 0, {
      message: 'Model ID cannot be empty or whitespace only',
    }),
  keyId: z.uuid('Invalid API key ID'),
  prompt: z.string().trim().min(1).max(5000),
});

/**
 * POST /api/workflow/video-stream
 *
 * Video generation streaming endpoint.
 * Streams SSE events: heartbeat, video, complete, error.
 * On video completion, downloads from Together AI and re-uploads to user storage.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await request.json();
    const validationResult = videoStreamSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { workflowId, modelId, keyId, prompt } = validationResult.data;

    const keyMap = await fetchUserApiKeys([keyId], session.user.id);
    const keyData = keyMap.get(keyId);

    if (!keyData) {
      return new Response(
        JSON.stringify({
          error: 'API key not found or not authorized',
          keyId,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();

        try {
          // Get the runtime provider from model card
          const runtimeProvider = getRuntimeProvider(modelId) as VideoRuntimeProvider | null;

          const videoGenerator = generateVideo(
            {
              apiKey: keyData.apiKey,
              baseURL: keyData.proxyUrl ?? undefined,
              provider: runtimeProvider ?? undefined,
            },
            {
              model: getRuntimeModelId(modelId) ?? modelId,
              prompt,
            },
            request.signal,
          );

          for await (const event of videoGenerator) {
            if (event.type === 'heartbeat') {
              const heartbeatEvent = JSON.stringify({
                type: 'heartbeat',
                workflowId,
              });
              controller.enqueue(encoder.encode(`data: ${heartbeatEvent}\n\n`));
            } else if (event.type === 'video' && event.video) {
              // Video generation complete - download and re-upload to user storage
              let permanentUrl = event.video.url;
              let storagePath: string | undefined;

              try {
                const videoResponse = await fetch(event.video.url);
                if (videoResponse.ok) {
                  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
                  const storage = createStorageService();
                  const timestamp = Date.now();
                  const randomId = crypto.randomUUID().slice(0, 8);
                  storagePath = `users/${session.user.id}/videos/${timestamp}-${randomId}.mp4`;

                  await storage.upload(storagePath, videoBuffer, {
                    contentType: 'video/mp4',
                  });
                  permanentUrl = await storage.createDownloadUrl(storagePath, {
                    expiresIn: 7 * 24 * 60 * 60, // 7 days
                  });
                }
              } catch (uploadError) {
                // Fall back to original Together AI URL if upload fails
                console.error('Failed to upload video to storage:', uploadError);
              }

              const videoEvent = JSON.stringify({
                type: 'video',
                workflowId,
                video: {
                  url: permanentUrl,
                  storagePath: storagePath,
                  mimeType: event.video.mimeType,
                  thumbnailUrl: event.video.thumbnailUrl,
                },
              });
              controller.enqueue(encoder.encode(`data: ${videoEvent}\n\n`));

              const totalTime = Date.now() - startTime;
              const completeEvent = JSON.stringify({
                type: 'complete',
                workflowId,
                metrics: {
                  totalTime,
                },
              });
              controller.enqueue(encoder.encode(`data: ${completeEvent}\n\n`));
            } else if (event.type === 'error') {
              const errorEvent = JSON.stringify({
                type: 'error',
                workflowId,
                error: event.error,
              });
              controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = extractApiErrorMessage(error);
          const errorEvent = JSON.stringify({
            type: 'error',
            workflowId,
            error: errorMessage,
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logError('Video stream error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
