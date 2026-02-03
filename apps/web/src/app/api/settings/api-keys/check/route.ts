import { generateText, ProviderBuilder, streamText } from '@lmring/ai-hub';
import { isVideoModel } from '@lmring/model-depot';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { connectionCheckSchema } from '@/libs/validation';

/**
 * Normalize proxy URL to ensure it has proper format
 */
function normalizeProxyUrl(proxyUrl: string): string {
  const trimmed = proxyUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('#')) {
    return trimmed;
  }
  // Check if URL already has API version path
  const versionRegex = /\/v\d+(?:alpha|beta)?(?=\/|$)/i;
  try {
    const parsedUrl = new URL(trimmed);
    if (versionRegex.test(parsedUrl.pathname)) {
      return trimmed;
    }
  } catch {
    if (versionRegex.test(trimmed)) {
      return trimmed;
    }
  }
  return `${trimmed}/v1`;
}

/**
 * Map of providers that need special handling
 */
const COMPATIBLE_PROVIDERS: Record<string, string> = {
  google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  vertex: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  cohere: 'https://api.cohere.ai/v1',
  together: 'https://api.together.xyz/v1',
  perplexity: 'https://api.perplexity.ai',
};

/**
 * Create a provider instance for connection testing
 */
function createTestProvider(
  providerId: string,
  apiKey: string,
  proxyUrl?: string,
): ReturnType<typeof ProviderBuilder.openai> {
  const baseURL = proxyUrl ? normalizeProxyUrl(proxyUrl) : undefined;

  switch (providerId) {
    case 'openai':
      return ProviderBuilder.openai(apiKey, baseURL);
    case 'anthropic':
      return ProviderBuilder.anthropic(apiKey, baseURL);
    case 'deepseek':
      return ProviderBuilder.deepseek(apiKey, baseURL);
    case 'mistral':
      return ProviderBuilder.mistral(apiKey, baseURL);
    case 'xai':
      return ProviderBuilder.xai(apiKey, baseURL);
    case 'openrouter':
      return ProviderBuilder.openrouter(apiKey, baseURL);
  }

  // For compatible providers, use OpenAI-compatible interface
  const defaultUrl = COMPATIBLE_PROVIDERS[providerId];
  if (defaultUrl) {
    return ProviderBuilder.compatible(providerId, apiKey, baseURL || defaultUrl);
  }

  // For unknown providers, try as OpenAI-compatible with custom baseURL
  if (baseURL) {
    return ProviderBuilder.compatible(providerId, apiKey, baseURL);
  }

  throw new Error(`Unsupported provider: ${providerId}. Please provide a proxy URL.`);
}

/**
 * POST /api/settings/api-keys/check
 * Test connection to an AI provider
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();

    const validationResult = connectionCheckSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { providerName, providerType, apiKey, proxyUrl, model } = validationResult.data;

    // Early return for video models (cannot be tested via chat endpoint)
    if (isVideoModel(model)) {
      return NextResponse.json({
        success: true,
        message:
          'Video models cannot be tested via chat endpoint. Test by generating a video in Arena.',
        skipReason: 'video_model',
      });
    }

    let provider: ReturnType<typeof ProviderBuilder.openai>;
    try {
      provider = createTestProvider(providerType || providerName, apiKey, proxyUrl);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'PROVIDER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create provider',
        },
        { status: 400 },
      );
    }

    // Test connection with a simple message
    // Try streamText first (works with streaming-only endpoints),
    // then fall back to generateText if streaming fails
    const startTime = Date.now();
    try {
      let responseText: string;

      try {
        // First attempt: use streamText (more compatible with streaming-only proxies)
        const streamResult = streamText({
          model: provider.languageModel(model),
          messages: [{ role: 'user', content: 'hello' }],
          maxRetries: 0,
        });
        responseText = await streamResult.text;
      } catch (streamError) {
        // Check if the error indicates streaming is not supported
        const errorMsg = streamError instanceof Error ? streamError.message : '';
        const isStreamNotSupported =
          errorMsg.toLowerCase().includes('stream') &&
          (errorMsg.toLowerCase().includes('not supported') ||
            errorMsg.toLowerCase().includes('disabled') ||
            errorMsg.toLowerCase().includes('false'));

        if (isStreamNotSupported) {
          // Fallback: use generateText for non-streaming endpoints
          const generateResult = await generateText({
            model: provider.languageModel(model),
            messages: [{ role: 'user', content: 'hello' }],
            maxRetries: 0,
          });
          responseText = generateResult.text;
        } else {
          // Re-throw
          throw streamError;
        }
      }

      const responseTimeMs = Date.now() - startTime;

      return NextResponse.json(
        {
          success: true,
          message: 'Connection successful',
          responseTimeMs,
          modelResponse: responseText?.slice(0, 100),
        },
        { status: 200 },
      );
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Parse common error types
      let errorType = 'CONNECTION_FAILED';
      let userMessage = errorMessage;

      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorType = 'INVALID_API_KEY';
        userMessage = 'Invalid API key. Please check your API key and try again.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorType = 'ACCESS_DENIED';
        userMessage = 'Access denied. Your API key may not have permission to use this model.';
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        errorType = 'MODEL_NOT_FOUND';
        userMessage = `Model "${model}" not found. Please check the model name.`;
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        errorType = 'RATE_LIMITED';
        userMessage = 'Rate limited. Please wait a moment and try again.';
      } else if (
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('timeout')
      ) {
        errorType = 'NETWORK_ERROR';
        userMessage = 'Network error. Please check the proxy URL and your internet connection.';
      }

      logError('Connection check failed', error);

      return NextResponse.json(
        {
          success: false,
          error: errorType,
          message: userMessage,
          details: errorMessage,
          responseTimeMs,
        },
        { status: 200 }, // Return 200 so frontend can handle the error gracefully
      );
    }
  } catch (error) {
    logError('Connection check error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
