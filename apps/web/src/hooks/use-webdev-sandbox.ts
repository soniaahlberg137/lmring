'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { filesToRecord, parseGeneratedFiles } from '@/libs/parse-generated-files';
import { useWebDevStore } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import type { SandboxStatus } from '@/types/webdev';

/**
 * Maximum number of concurrent sandbox creations.
 * Stagger for 3-5 models to avoid overwhelming Vercel Sandbox API.
 */
const SANDBOX_CONCURRENCY_LIMIT = 2;

/**
 * Simple concurrency limiter — identical pattern to prompt-input.tsx.
 */
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

/**
 * SSE event types from POST /api/webdev/sandbox.
 * The sandbox API uses `responseId` as the identifier, not `workflowId`.
 */
interface SandboxSSEEvent {
  type:
    | 'sandbox-creating'
    | 'sandbox-installing'
    | 'sandbox-starting'
    | 'sandbox-ready'
    | 'snapshot-creating'
    | 'snapshot-ready'
    | 'snapshot-error'
    | 'error'
    | 'complete';
  responseId?: string;
  sandboxId?: string;
  previewUrl?: string;
  expiresAt?: string | null;
  snapshotId?: string;
  message?: string;
  sessionId?: string;
}

/**
 * Maps sandbox SSE event types to store status values.
 */
function sseEventToStatus(eventType: SandboxSSEEvent['type']): SandboxStatus | null {
  switch (eventType) {
    case 'sandbox-creating':
      return 'creating';
    case 'sandbox-installing':
      return 'installing';
    case 'sandbox-starting':
      return 'starting';
    case 'snapshot-creating':
      return 'snapshotting';
    default:
      return null;
  }
}

interface UseWebDevSandboxOptions {
  /**
   * Called when a responseId is needed for a workflowId.
   * This must be provided by the parent since response creation
   * is handled during the generation phase, not here.
   */
  getResponseId: (workflowId: string) => string | undefined;
}

/**
 * Hook that watches workflow completions and automatically triggers
 * sandbox creation for each completed workflow.
 *
 * Flow per workflow:
 * 1. Workflow status → 'completed' (observed via useWorkflowStore)
 * 2. Parse final output → extract files via `---FILE:---` markers
 * 3. POST /api/webdev/sandbox with SSE streaming
 * 4. SSE events → update webdev store (initSandbox → status transitions → setSandboxReady)
 * 5. Auto-select first ready sandbox as active tab
 */
export function useWebDevSandbox({ getResponseId }: UseWebDevSandboxOptions) {
  const sessionId = useWebDevStore((s) => s.sessionId);
  const initSandbox = useWebDevStore((s) => s.initSandbox);
  const updateSandboxStatus = useWebDevStore((s) => s.updateSandboxStatus);
  const setSandboxReady = useWebDevStore((s) => s.setSandboxReady);
  const setSandboxFiles = useWebDevStore((s) => s.setSandboxFiles);
  const setPhase = useWebDevStore((s) => s.setPhase);
  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const activeWorkflowId = useWebDevStore((s) => s.activeWorkflowId);
  const getSandbox = useWebDevStore((s) => s.getSandbox);
  const setSnapshotId = useWebDevStore((s) => s.setSnapshotId);

  const getWorkflow = useWorkflowStore((s) => s.getWorkflow);
  const workflows = useWorkflowStore((s) => s.workflows);

  /** Ref to avoid stale closure on activeWorkflowId in SSE consumer */
  const activeWorkflowIdRef = useRef(activeWorkflowId);
  activeWorkflowIdRef.current = activeWorkflowId;

  /** Track which workflowIds have already been queued for sandbox creation */
  const processedRef = useRef<Set<string>>(new Set());

  /** Per-workflow abort controllers for cancellation */
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /** Concurrency limiter for staggered sandbox creation */
  const limiterRef = useRef(createConcurrencyLimiter(SANDBOX_CONCURRENCY_LIMIT));

  /**
   * Consume an SSE stream from POST /api/webdev/sandbox,
   * updating the webdev store as events arrive.
   */
  const consumeSandboxStream = useCallback(
    async (workflowId: string, response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        updateSandboxStatus(workflowId, 'error', 'Response body is not readable');
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
              const event = JSON.parse(data) as SandboxSSEEvent;

              // Map progressive SSE events to store status
              const status = sseEventToStatus(event.type);
              if (status) {
                updateSandboxStatus(workflowId, status);
                continue;
              }

              if (event.type === 'sandbox-ready' && event.sandboxId && event.previewUrl) {
                setSandboxReady(
                  workflowId,
                  event.sandboxId,
                  event.previewUrl,
                  event.expiresAt ?? null,
                );
                setPhase('ready');

                // Auto-select first ready sandbox if no tab selected yet
                if (!activeWorkflowIdRef.current) {
                  setActiveWorkflowId(workflowId);
                }
              }

              if (event.type === 'snapshot-ready' && event.sandboxId && event.previewUrl) {
                setSandboxReady(
                  workflowId,
                  event.sandboxId,
                  event.previewUrl,
                  event.expiresAt ?? null,
                );
                if (event.snapshotId) {
                  setSnapshotId(workflowId, event.snapshotId);
                }
                setPhase('ready');

                if (!activeWorkflowIdRef.current) {
                  setActiveWorkflowId(workflowId);
                }
              }

              if (event.type === 'snapshot-error') {
                console.warn('[useWebDevSandbox] Snapshot error:', event.message);
              }

              if (event.type === 'error') {
                updateSandboxStatus(
                  workflowId,
                  'error',
                  event.message ?? 'Sandbox creation failed',
                );
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
    [updateSandboxStatus, setSandboxReady, setActiveWorkflowId, setPhase, setSnapshotId],
  );

  /**
   * Create a sandbox for a single completed workflow.
   * Called through the concurrency limiter.
   */
  const createSandboxForWorkflow = useCallback(
    async (workflowId: string) => {
      if (!sessionId) return;

      const responseId = getResponseId(workflowId);
      if (!responseId) {
        console.error('[useWebDevSandbox] No responseId for workflow:', workflowId);
        updateSandboxStatus(workflowId, 'error', 'Missing response ID');
        return;
      }

      const workflow = getWorkflow(workflowId);
      if (!workflow) return;

      // Extract the last assistant message content
      const lastAssistant = [...workflow.messages].reverse().find((m) => m.role === 'assistant');
      if (!lastAssistant) {
        updateSandboxStatus(workflowId, 'error', 'No generated output found');
        return;
      }

      // Save raw AI content to DB (fire-and-forget)
      fetch(`/api/webdev/session/${sessionId}/response/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lastAssistant.content }),
      }).catch(() => {});

      // Parse files from AI output
      const files = parseGeneratedFiles(lastAssistant.content);
      if (files.length === 0) {
        updateSandboxStatus(workflowId, 'error', 'No files generated');
        return;
      }

      // Store parsed files in the webdev store
      setSandboxFiles(workflowId, filesToRecord(files));

      // Transition phase to 'building'
      setPhase('building');

      const abortController = new AbortController();
      abortControllersRef.current.set(workflowId, abortController);

      try {
        const response = await fetch('/api/webdev/sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: files.map((f) => ({ path: f.path, content: f.content })),
            sessionId,
            responseId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = 'Sandbox creation failed';
          try {
            const errorData = await response.json();
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            }
          } catch {
            // ignore
          }
          updateSandboxStatus(workflowId, 'error', errorMessage);
          return;
        }

        await consumeSandboxStream(workflowId, response);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          updateSandboxStatus(workflowId, 'stopped');
        } else {
          const message = error instanceof Error ? error.message : 'Unknown error';
          updateSandboxStatus(workflowId, 'error', message);
        }
      } finally {
        abortControllersRef.current.delete(workflowId);
      }
    },
    [
      sessionId,
      getResponseId,
      getWorkflow,
      setSandboxFiles,
      setPhase,
      updateSandboxStatus,
      consumeSandboxStream,
    ],
  );

  /**
   * Watch workflow status changes and trigger sandbox creation
   * when a workflow completes, or surface errors when it fails.
   */
  useEffect(() => {
    for (const [workflowId, workflow] of workflows) {
      if (processedRef.current.has(workflowId)) continue;

      if (workflow.status === 'completed') {
        processedRef.current.add(workflowId);

        const existingSandbox = getSandbox(workflowId);
        if (existingSandbox && existingSandbox.status !== 'idle') continue;

        initSandbox(workflowId);

        void limiterRef.current(() => createSandboxForWorkflow(workflowId));
      } else if (workflow.status === 'failed') {
        processedRef.current.add(workflowId);

        initSandbox(workflowId);
        updateSandboxStatus(workflowId, 'error', workflow.error ?? 'Generation failed');

        const modelName = workflow.modelId.split(':').slice(1).join(':') || workflow.modelId;
        toast.error(`${modelName}: ${workflow.error ?? 'Generation failed'}`);
      }
    }

    // Check if all workflows have reached a terminal state with none completed.
    // This prevents the phase from being stuck at 'generating' forever.
    if (workflows.size > 0) {
      const terminalStates = new Set(['failed', 'cancelled', 'completed']);
      const allTerminal = [...workflows.values()].every((w) => terminalStates.has(w.status));
      const anyCompleted = [...workflows.values()].some((w) => w.status === 'completed');

      if (allTerminal && !anyCompleted) {
        setPhase('error');
      }
    }
  }, [workflows, initSandbox, createSandboxForWorkflow, getSandbox, updateSandboxStatus, setPhase]);

  /**
   * Cancel a specific sandbox creation in progress.
   */
  const cancelSandbox = useCallback((workflowId: string) => {
    const controller = abortControllersRef.current.get(workflowId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(workflowId);
    }
  }, []);

  /**
   * Cancel all in-progress sandbox creations.
   */
  const cancelAllSandboxes = useCallback(() => {
    for (const [, controller] of abortControllersRef.current) {
      controller.abort();
    }
    abortControllersRef.current.clear();
  }, []);

  /**
   * Rebuild a sandbox from stored files (e.g. after session reload
   * when the original VM has expired).
   */
  const rebuildSandboxFromFiles = useCallback(
    (
      workflowId: string,
      files: Record<string, string>,
      targetSessionId: string,
      responseId: string,
      snapshotId?: string | null,
    ) => {
      // Prevent duplicate sandbox creation
      processedRef.current.add(workflowId);

      void limiterRef.current(async () => {
        const fileArray = Object.entries(files).map(([path, content]) => ({ path, content }));

        const abortController = new AbortController();
        abortControllersRef.current.set(workflowId, abortController);

        try {
          const response = await fetch('/api/webdev/sandbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: fileArray,
              sessionId: targetSessionId,
              responseId,
              ...(snapshotId ? { snapshotId } : {}),
            }),
            signal: abortController.signal,
          });

          if (!response.ok) {
            let errorMessage = 'Sandbox rebuild failed';
            try {
              const errorData = await response.json();
              if (typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              }
            } catch {
              // ignore
            }
            updateSandboxStatus(workflowId, 'error', errorMessage);
            return;
          }

          await consumeSandboxStream(workflowId, response);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            updateSandboxStatus(workflowId, 'stopped');
          } else {
            const message = error instanceof Error ? error.message : 'Unknown error';
            updateSandboxStatus(workflowId, 'error', message);
          }
        } finally {
          abortControllersRef.current.delete(workflowId);
        }
      });
    },
    [updateSandboxStatus, consumeSandboxStream],
  );

  /**
   * Reset processed set (call when starting a new generation round).
   */
  const resetProcessed = useCallback(() => {
    processedRef.current.clear();
  }, []);

  /**
   * Cleanup on unmount — cancel all in-flight requests.
   */
  useEffect(() => {
    return () => {
      for (const [, controller] of abortControllersRef.current) {
        controller.abort();
      }
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    cancelSandbox,
    cancelAllSandboxes,
    resetProcessed,
    rebuildSandboxFromFiles,
  };
}
