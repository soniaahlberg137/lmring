'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SANDBOX_CONCURRENCY_LIMIT = 2;

export interface SharedSandboxState {
  status: 'idle' | 'creating' | 'installing' | 'starting' | 'ready' | 'error';
  previewUrl: string | null;
  sandboxId: string | null;
  error: string | null;
}

interface SharedSandboxSSEEvent {
  type:
    | 'sandbox-creating'
    | 'sandbox-installing'
    | 'sandbox-starting'
    | 'sandbox-ready'
    | 'error'
    | 'complete';
  sandboxId?: string;
  previewUrl?: string;
  message?: string;
}

interface SharedResponse {
  id: string;
  snapshotId: string | null;
}

function createConcurrencyLimiter(limit: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (queue.length > 0 && running < limit) {
      running++;
      const resolve = queue.shift();
      resolve?.();
    }
  };

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
      next();
    });

    try {
      return await fn();
    } finally {
      running--;
      next();
    }
  };
}

function sseEventToStatus(
  eventType: SharedSandboxSSEEvent['type'],
): SharedSandboxState['status'] | null {
  switch (eventType) {
    case 'sandbox-creating':
      return 'creating';
    case 'sandbox-installing':
      return 'installing';
    case 'sandbox-starting':
      return 'starting';
    default:
      return null;
  }
}

export function useSharedWebDevSandbox(shareToken: string, responses: SharedResponse[]) {
  const [sandboxes, setSandboxes] = useState<Map<string, SharedSandboxState>>(() => {
    const initial = new Map<string, SharedSandboxState>();
    for (const r of responses) {
      initial.set(r.id, { status: 'idle', previewUrl: null, sandboxId: null, error: null });
    }
    return initial;
  });

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const limiterRef = useRef(createConcurrencyLimiter(SANDBOX_CONCURRENCY_LIMIT));
  const mountedRef = useRef(false);

  const updateSandbox = useCallback((responseId: string, update: Partial<SharedSandboxState>) => {
    setSandboxes((prev) => {
      const current = prev.get(responseId);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(responseId, { ...current, ...update });
      return next;
    });
  }, []);

  const consumeStream = useCallback(
    async (responseId: string, response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        updateSandbox(responseId, { status: 'error', error: 'Response body is not readable' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const event = JSON.parse(data) as SharedSandboxSSEEvent;

              const status = sseEventToStatus(event.type);
              if (status) {
                updateSandbox(responseId, { status });
                continue;
              }

              if (event.type === 'sandbox-ready' && event.sandboxId && event.previewUrl) {
                updateSandbox(responseId, {
                  status: 'ready',
                  sandboxId: event.sandboxId,
                  previewUrl: event.previewUrl,
                });
              }

              if (event.type === 'error') {
                updateSandbox(responseId, {
                  status: 'error',
                  error: event.message ?? 'Sandbox creation failed',
                });
              }
            } catch {
              // Skip unparseable SSE lines
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
    [updateSandbox],
  );

  const createSandbox = useCallback(
    async (responseId: string) => {
      const response = responses.find((r) => r.id === responseId);
      if (!response) return;

      updateSandbox(responseId, { status: 'creating', error: null });

      const abortController = new AbortController();
      abortControllersRef.current.set(responseId, abortController);

      try {
        const res = await fetch('/api/webdev/sandbox/shared', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareToken,
            responseId,
            ...(response.snapshotId ? { snapshotId: response.snapshotId } : {}),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          let errorMessage = 'Sandbox creation failed';
          try {
            const errorData = await res.json();
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            }
          } catch {
            // ignore
          }
          updateSandbox(responseId, { status: 'error', error: errorMessage });
          return;
        }

        await consumeStream(responseId, res);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        updateSandbox(responseId, { status: 'error', error: message });
      } finally {
        abortControllersRef.current.delete(responseId);
      }
    },
    [shareToken, responses, updateSandbox, consumeStream],
  );

  // Auto-create sandboxes on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    for (const r of responses) {
      void limiterRef.current(() => createSandbox(r.id));
    }
  }, [responses, createSandbox]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, controller] of abortControllersRef.current) {
        controller.abort();
      }
      abortControllersRef.current.clear();
    };
  }, []);

  const isAnyLoading = Array.from(sandboxes.values()).some(
    (s) => s.status === 'creating' || s.status === 'installing' || s.status === 'starting',
  );

  return { sandboxes, createSandbox, isAnyLoading };
}
