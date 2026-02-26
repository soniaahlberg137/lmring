import { APICallError } from '@lmring/ai-hub';

export interface StructuredApiError {
  statusCode?: number;
  detail: string;
  provider?: string;
  isRetryable?: boolean;
}

/**
 * Parse a response body string to extract a human-readable error detail.
 * Handles common provider formats:
 * - OpenAI: {"error":{"message":"..."}}
 * - Anthropic: {"type":"error","error":{"type":"...","message":"..."}}
 * - Simple: {"detail":"..."}
 */
function parseResponseBody(body: string): string | null {
  try {
    const parsed = JSON.parse(body);

    // OpenAI format: { error: { message: "..." } }
    if (parsed?.error?.message) {
      return parsed.error.message;
    }

    // Anthropic format: { type: "error", error: { message: "..." } }
    if (parsed?.type === 'error' && parsed?.error?.message) {
      return parsed.error.message;
    }

    // Simple format: { detail: "..." }
    if (typeof parsed?.detail === 'string') {
      return parsed.detail;
    }

    // Simple format: { message: "..." }
    if (typeof parsed?.message === 'string') {
      return parsed.message;
    }

    return null;
  } catch {
    return null;
  }
}

function extractHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Extract structured error information from AI SDK errors.
 * Returns a JSON string for structured errors, or a plain string for others.
 */
export function extractApiErrorMessage(error: unknown): string {
  if (APICallError.isInstance(error)) {
    const detail =
      (error.responseBody ? parseResponseBody(error.responseBody) : null) ?? error.message;

    const structured: StructuredApiError = {
      statusCode: error.statusCode,
      detail,
      provider: extractHostname(error.url),
      isRetryable: error.isRetryable,
    };

    return JSON.stringify(structured);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}
