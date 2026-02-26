import { type ModelMessage, streamText } from '@lmring/ai-hub';
import { detectReasoningByModelId, getModel } from '@lmring/model-depot';
import { auth } from '@/libs/Auth';
import { extractApiErrorMessage } from '@/libs/api-error-utils';
import { logError } from '@/libs/error-logging';
import { createProvider, fetchUserApiKeys } from '@/libs/provider-factory';
import { type SupportedProvider, workflowStreamSchema } from '@/libs/validation';

/**
 * Check if a model has reasoning capability.
 * - Non-custom models: use model-depot lookup
 * - Custom models: use regex-based detection on modelId
 */
function isReasoningModel(providerId: string, modelId: string, isCustom: boolean): boolean {
  if (!isCustom) {
    // Non-custom: use model-depot lookup
    const model = getModel(providerId, modelId);
    return model?.abilities?.reasoning === true;
  }

  // Custom: use regex detection
  return detectReasoningByModelId(modelId);
}

/**
 * Check if a model supports temperature parameter
 * - ALL reasoning models do NOT support temperature (AI SDK enforces this)
 * - Non-reasoning models support temperature
 */
function supportsTemperature(hasReasoning: boolean): boolean {
  return !hasReasoning;
}

/**
 * Provider-specific options for reasoning models
 */
type ReasoningProviderOptions =
  | { openai: { reasoningSummary: 'auto' } }
  | { anthropic: { thinking: { type: 'enabled'; budgetTokens: number } } }
  | { google: { thinkingConfig: { includeThoughts: true } } }
  | undefined;

/**
 * Get provider-specific options for reasoning models.
 * Returns options compatible with AI SDK's providerOptions type.
 *
 * @param providerType - The underlying provider type (e.g., 'openai', 'anthropic', 'google')
 * @param hasReasoning - Whether the model supports reasoning
 */
function getReasoningProviderOptions(
  providerType: string,
  hasReasoning: boolean,
): ReasoningProviderOptions {
  if (!hasReasoning) {
    return undefined;
  }

  switch (providerType) {
    case 'openai':
    case 'azure':
      return { openai: { reasoningSummary: 'auto' } };

    case 'anthropic':
      return { anthropic: { thinking: { type: 'enabled', budgetTokens: 10000 } } };

    case 'google':
    case 'gemini':
      return { google: { thinkingConfig: { includeThoughts: true } } };

    // xai/grok, deepseek, qwen etc. - no special options needed
    default:
      return undefined;
  }
}

/**
 * POST /api/workflow/stream
 *
 * Single workflow streaming endpoint.
 * Unlike /api/arena/stream which handles multiple models in batch,
 * this endpoint handles a single model with independent message history.
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
    const validationResult = workflowStreamSchema.safeParse(rawBody);

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

    const body = validationResult.data;
    const { workflowId, modelId, keyId, messages, config, attachments } = body;

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

    // For custom providers, use providerType (the underlying provider like "anthropic")
    const effectiveProvider =
      keyData.isCustom && keyData.providerType
        ? keyData.providerType.toLowerCase()
        : keyData.providerName.toLowerCase();

    const providerName = effectiveProvider as SupportedProvider;
    const provider = createProvider(providerName, keyData.apiKey, keyData.proxyUrl ?? undefined);

    // Check model capabilities
    // - Non-custom: use model-depot lookup with providerName
    // - Custom: use regex detection and providerType for options
    const hasReasoning = isReasoningModel(providerName, modelId, keyData.isCustom);
    const canUseTemperature = supportsTemperature(hasReasoning);

    // For reasoning options, use providerType for custom providers
    const providerTypeForOptions = keyData.isCustom
      ? (keyData.providerType || 'openai').toLowerCase()
      : providerName;
    const reasoningOptions = getReasoningProviderOptions(providerTypeForOptions, hasReasoning);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let firstTokenTime: number | undefined;

        try {
          // Format messages, adding image attachments to the last user message if present
          const formattedMessages: ModelMessage[] = messages.map((m, index) => {
            const isLastUserMessage =
              index === messages.length - 1 && m.role === 'user' && attachments?.length;

            if (isLastUserMessage) {
              // Include images with the last user message as multimodal content
              return {
                role: 'user' as const,
                content: [
                  ...attachments.map((att) => ({
                    type: 'image' as const,
                    image: att.data, // base64 data URL
                  })),
                  { type: 'text' as const, text: m.content },
                ],
              };
            }

            // For all other messages, return as-is
            return {
              role: m.role,
              content: m.content,
            };
          });

          const result = streamText({
            model: provider.languageModel(modelId),
            messages: formattedMessages,
            ...(canUseTemperature && { temperature: config.temperature }),
            // Skip maxOutputTokens when using custom proxy URL (some proxies don't support it)
            ...(!keyData.proxyUrl && config.maxTokens && { maxOutputTokens: config.maxTokens }),
            // Only pass optional params when they have values (avoids Anthropic conflict)
            ...(config.topP != null && canUseTemperature && { topP: config.topP }),
            ...(config.frequencyPenalty != null &&
              canUseTemperature && { frequencyPenalty: config.frequencyPenalty }),
            ...(config.presencePenalty != null &&
              canUseTemperature && { presencePenalty: config.presencePenalty }),
            ...(reasoningOptions && { providerOptions: reasoningOptions }),
          });

          for await (const part of result.fullStream) {
            const isText = part.type === 'text-delta';
            const isReasoningDelta = part.type === 'reasoning-delta';

            if ((isText || isReasoningDelta) && firstTokenTime === undefined) {
              firstTokenTime = Date.now() - startTime;
              const ttftEvent = JSON.stringify({
                type: 'ttft',
                workflowId,
                value: firstTokenTime,
              });
              controller.enqueue(encoder.encode(`data: ${ttftEvent}\n\n`));
            }

            if (isText) {
              const chunkEvent = JSON.stringify({
                type: 'chunk',
                workflowId,
                chunk: part.text,
              });
              controller.enqueue(encoder.encode(`data: ${chunkEvent}\n\n`));
            } else if (isReasoningDelta) {
              // Streaming reasoning delta
              const reasoningEvent = JSON.stringify({
                type: 'reasoning',
                workflowId,
                reasoning: part.text,
              });
              controller.enqueue(encoder.encode(`data: ${reasoningEvent}\n\n`));
            } else if (part.type === 'error') {
              const errorMessage = extractApiErrorMessage(part.error);
              const errorEvent = JSON.stringify({
                type: 'error',
                workflowId,
                error: errorMessage,
              });
              controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }

          const usage = await result.usage;
          const totalTime = Date.now() - startTime;
          const totalTokens = usage?.totalTokens ?? 0;
          const tokensPerSecond = totalTime > 0 ? (totalTokens / totalTime) * 1000 : 0;

          const completeEvent = JSON.stringify({
            type: 'complete',
            workflowId,
            metrics: {
              totalTime,
              timeToFirstToken: firstTokenTime,
              tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
              promptTokens: usage?.inputTokens,
              completionTokens: usage?.outputTokens,
              totalTokens: usage?.totalTokens,
            },
          });
          controller.enqueue(encoder.encode(`data: ${completeEvent}\n\n`));

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
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
    logError('Workflow stream error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
