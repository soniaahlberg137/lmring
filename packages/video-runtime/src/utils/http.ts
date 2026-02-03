/**
 * HTTP Client Utilities
 *
 * Wrapper around fetch with timeout, retry, and error handling.
 */

import { VideoError } from './errors';

/**
 * HTTP request options.
 */
export interface HttpRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (will be JSON stringified if object) */
  body?: unknown;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * HTTP response wrapper.
 */
export interface HttpResponse<T = unknown> {
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Parsed response body */
  data: T;
  /** Response headers */
  headers: Headers;
}

/**
 * Default timeout for HTTP requests (5 minutes).
 */
const DEFAULT_TIMEOUT = 300_000;

/**
 * Create a timeout signal that aborts after the specified duration.
 */
function createTimeoutSignal(timeout: number): AbortSignal {
  return AbortSignal.timeout(timeout);
}

/**
 * Combine multiple abort signals into one.
 */
function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);

  if (validSignals.length === 0) {
    return undefined;
  }

  if (validSignals.length === 1) {
    return validSignals[0];
  }

  const controller = new AbortController();

  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }

  return controller.signal;
}

/**
 * Make an HTTP request with timeout and error handling.
 *
 * @param url - Request URL
 * @param options - Request options
 * @returns Response wrapper
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<T>> {
  const { method = 'GET', headers = {}, body, timeout = DEFAULT_TIMEOUT, signal } = options;

  const timeoutSignal = createTimeoutSignal(timeout);
  const combinedSignal = combineSignals(signal, timeoutSignal);

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });

    // Parse response body
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T;
    } else {
      // Try to parse as JSON anyway, fall back to text
      const text = await response.text();
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as unknown as T;
      }
    }

    // Check for error status codes
    if (!response.ok) {
      throw createHttpError(response.status, response.statusText, data);
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof VideoError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (signal?.aborted) {
          throw VideoError.from(error, { code: 'NETWORK_ERROR' });
        }
        throw VideoError.timeout(`Request to ${url} timed out after ${timeout}ms`);
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new VideoError({
          code: 'NETWORK_ERROR',
          message: `Network error: ${error.message}`,
          retryable: true,
          cause: error,
        });
      }
    }

    throw VideoError.from(error);
  }
}

/**
 * Create a VideoError from an HTTP error response.
 */
function createHttpError(status: number, statusText: string, body: unknown): VideoError {
  // Extract error message from body if possible
  let message = `HTTP ${status}: ${statusText}`;
  const cause = body;

  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.error === 'string') {
      message = obj.error;
    } else if (typeof obj.message === 'string') {
      message = obj.message;
    } else if (typeof obj.error === 'object' && obj.error !== null) {
      const errorObj = obj.error as Record<string, unknown>;
      if (typeof errorObj.message === 'string') {
        message = errorObj.message;
      }
    }
  }

  // Map status codes to error codes
  switch (status) {
    case 400:
      return new VideoError({
        code: 'INVALID_PARAMS',
        message,
        retryable: false,
        cause,
      });
    case 401:
    case 403:
      return new VideoError({
        code: 'PROVIDER_ERROR',
        message: `Authentication failed: ${message}`,
        retryable: false,
        cause,
      });
    case 404:
      return new VideoError({
        code: 'MODEL_NOT_FOUND',
        message,
        retryable: false,
        cause,
      });
    case 429:
      return new VideoError({
        code: 'RATE_LIMIT',
        message,
        retryable: true,
        cause,
      });
    case 500:
    case 502:
    case 503:
    case 504:
      return new VideoError({
        code: 'PROVIDER_ERROR',
        message,
        retryable: true,
        cause,
      });
    default:
      return new VideoError({
        code: 'PROVIDER_ERROR',
        message,
        retryable: false,
        cause,
      });
  }
}

/**
 * Build a URL with query parameters.
 *
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns URL with query string
 */
export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Join URL path segments.
 *
 * @param base - Base URL
 * @param paths - Path segments to join
 * @returns Joined URL
 */
export function joinUrl(base: string, ...paths: string[]): string {
  let result = base.replace(/\/+$/, '');

  for (const path of paths) {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    if (cleanPath) {
      result += `/${cleanPath}`;
    }
  }

  return result;
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @param signal - Optional abort signal
 */
export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      },
      { once: true },
    );
  });
}
