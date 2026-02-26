import type { StructuredApiError } from './api-error-utils';

export interface FormattedError {
  title: string;
  detail: string;
  isRetryable: boolean;
}

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Authentication Failed',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Rate Limited',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * Try to parse an error string as a StructuredApiError JSON.
 * Returns null if the string is not valid structured error JSON.
 */
export function tryParseStructuredError(errorString: string): StructuredApiError | null {
  try {
    const parsed = JSON.parse(errorString);
    if (parsed && typeof parsed === 'object' && typeof parsed.detail === 'string') {
      return parsed as StructuredApiError;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to extract a human-readable message from embedded JSON in a plain error string.
 * Handles strings like: 'AI_APICallError: {"detail":"Store must be set to false"}'
 */
function cleanPlainErrorString(errorString: string): string {
  // Try to find embedded JSON in the string
  const jsonMatch = errorString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) return parsed.error.message;
      if (parsed?.detail) return parsed.detail;
      if (parsed?.message) return parsed.message;
    } catch {
      // Not valid JSON, return original
    }
  }
  return errorString;
}

/**
 * Format an error string for user-friendly display.
 * Handles both structured (JSON) and plain error strings.
 */
export function formatErrorForDisplay(errorString: string | undefined | null): FormattedError {
  if (!errorString) {
    return { title: 'Request failed', detail: '', isRetryable: false };
  }

  const structured = tryParseStructuredError(errorString);

  if (structured) {
    const statusTitle = structured.statusCode ? STATUS_TITLES[structured.statusCode] : undefined;

    const title = statusTitle ? `${statusTitle} (${structured.statusCode})` : 'Request failed';

    const providerSuffix = structured.provider ? ` [${structured.provider}]` : '';
    const detail = `${structured.detail}${providerSuffix}`;

    return {
      title,
      detail,
      isRetryable: structured.isRetryable ?? false,
    };
  }

  // Plain string — try to clean up embedded JSON
  const cleaned = cleanPlainErrorString(errorString);
  return {
    title: 'Request failed',
    detail: cleaned,
    isRetryable: false,
  };
}
