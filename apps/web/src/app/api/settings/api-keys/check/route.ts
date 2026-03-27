import { generateText, streamText } from '@lmring/ai-hub';
import { isVideoModel } from '@lmring/model-depot';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { createProvider } from '@/libs/provider-factory';
import { connectionCheckSchema } from '@/libs/validation';

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

    let provider: ReturnType<typeof createProvider>;
    try {
      provider = createProvider(providerType || providerName, apiKey, proxyUrl);
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
        const errorMsg = streamError instanceof Error ? streamError.message : '';
        const errorName = streamError instanceof Error ? streamError.name : '';
        const isStreamNotSupported =
          errorMsg.toLowerCase().includes('stream') &&
          (errorMsg.toLowerCase().includes('not supported') ||
            errorMsg.toLowerCase().includes('disabled') ||
            errorMsg.toLowerCase().includes('false'));

        // AI SDK throws AI_NoOutputGeneratedError without chaining the real cause.
        // Fall back to generateText which throws AI_APICallError directly.
        const isNoOutput = errorName === 'AI_NoOutputGeneratedError';

        if (isStreamNotSupported || isNoOutput) {
          const generateResult = await generateText({
            model: provider.languageModel(model),
            messages: [{ role: 'user', content: 'hello' }],
            maxRetries: 0,
          });
          responseText = generateResult.text;
        } else {
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

      // Unwrap AI SDK error chain: AI_NoOutputGeneratedError → AI_APICallError
      const rootCause =
        error instanceof Error && error.cause instanceof Error ? error.cause : error;
      const errorMessage = rootCause instanceof Error ? rootCause.message : 'Unknown error';

      // Extract structured info from AI_APICallError
      const apiError = rootCause as Record<string, unknown>;
      const statusCode = typeof apiError.statusCode === 'number' ? apiError.statusCode : undefined;
      const responseBody =
        typeof apiError.responseBody === 'string' ? apiError.responseBody : undefined;

      // Build a combined string for status code + message matching
      const matchStr = [statusCode?.toString(), errorMessage, responseBody]
        .filter(Boolean)
        .join(' ');

      // Parse common error types
      let errorType = 'CONNECTION_FAILED';
      let userMessage = errorMessage;

      if (statusCode === 401 || matchStr.includes('Unauthorized')) {
        errorType = 'INVALID_API_KEY';
        userMessage = 'Invalid API key. Please check your API key and try again.';
      } else if (statusCode === 403 || matchStr.includes('Forbidden')) {
        errorType = 'ACCESS_DENIED';
        userMessage = 'Access denied. Your API key may not have permission to use this model.';
      } else if (
        statusCode === 404 ||
        matchStr.includes('Not Found') ||
        (matchStr.includes('model') && matchStr.includes('not exist'))
      ) {
        if (proxyUrl) {
          errorType = 'MODEL_NOT_FOUND_PROXY';
          userMessage = `Model "${model}" not found on the proxy. The proxy may use different model IDs. Try adding a custom model that matches your proxy's naming.`;
        } else {
          errorType = 'MODEL_NOT_FOUND';
          userMessage = `Model "${model}" not found. Please check the model name or select a different model.`;
        }
      } else if (statusCode === 429 || matchStr.includes('Rate limit')) {
        errorType = 'RATE_LIMITED';
        userMessage = 'Rate limited. Please wait a moment and try again.';
      } else if (
        matchStr.includes('ENOTFOUND') ||
        matchStr.includes('ECONNREFUSED') ||
        matchStr.includes('timeout')
      ) {
        errorType = 'NETWORK_ERROR';
        userMessage = 'Network error. Please check the proxy URL and your internet connection.';
      }

      logError('Connection check failed', error);

      // Include response body for frontend to display full error details
      const details = responseBody || errorMessage;

      return NextResponse.json(
        {
          success: false,
          error: errorType,
          message: userMessage,
          details,
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
