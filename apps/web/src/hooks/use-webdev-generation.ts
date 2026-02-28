'use client';

import { useCallback, useRef } from 'react';
import { WEBDEV_SYSTEM_PROMPT, WEBDEV_WORKFLOW_CONFIG } from '@/constants/webdev';
import { useWebDevStore } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import { useWorkflowExecution } from './use-workflow-execution';

interface SessionResponse {
  id: string;
  modelId: string;
  displayPosition: number;
}

interface StartGenerationParams {
  prompt: string;
  models: Array<{ modelId: string; keyId: string }>;
  sessionResponses: SessionResponse[];
  iteration?: { id: string; version: number };
}

interface IterationRef {
  id: string;
  version: number;
  prompt: string;
}

/**
 * Hook that orchestrates WebDev AI generation.
 *
 * Bridges the gap between session creation (DB records) and AI streaming:
 * 1. Creates workflows in the WorkflowStore (one per model)
 * 2. Seeds each workflow with the system prompt and config
 * 3. Maps workflowId -> responseId for sandbox creation
 * 4. Starts parallel AI streaming via startAllSyncedWorkflows
 */
export function useWebDevGeneration() {
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);
  const updateWorkflow = useWorkflowStore((s) => s.updateWorkflow);
  const setWorkflowConfig = useWorkflowStore((s) => s.setWorkflowConfig);
  const setGlobalPrompt = useWorkflowStore((s) => s.setGlobalPrompt);
  const resetConversation = useWorkflowStore((s) => s.resetConversation);

  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const setPhase = useWebDevStore((s) => s.setPhase);
  const initSandbox = useWebDevStore((s) => s.initSandbox);
  const snapshotCurrentIteration = useWebDevStore((s) => s.snapshotCurrentIteration);
  const sessionId = useWebDevStore((s) => s.sessionId);

  const { startAllSyncedWorkflows, continueAllSyncedWorkflows } = useWorkflowExecution();

  /** Maps workflowId -> responseId (DB record) for sandbox creation */
  const responseMapRef = useRef<Map<string, string>>(new Map());

  /** Tracks the current iteration for snapshotting on follow-up */
  const iterationRef = useRef<IterationRef>({ id: '', version: 0, prompt: '' });

  /**
   * Look up the DB responseId for a given workflowId.
   * Used by useWebDevSandbox to send the correct responseId to /api/webdev/sandbox.
   */
  const getResponseId = useCallback((workflowId: string): string | undefined => {
    return responseMapRef.current.get(workflowId);
  }, []);

  /**
   * Start initial AI generation after session creation.
   *
   * 1. Reset workflow store (clean slate)
   * 2. Create one workflow per model
   * 3. Map workflowId -> responseId
   * 4. Seed system message and config per workflow
   * 5. Set global prompt and start all synced workflows
   */
  const startGeneration = useCallback(
    async ({ prompt, models, sessionResponses, iteration }: StartGenerationParams) => {
      resetConversation();
      responseMapRef.current.clear();

      // Track current iteration
      if (iteration) {
        iterationRef.current = { id: iteration.id, version: iteration.version, prompt };
      }

      const workflowIds: string[] = [];
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        if (!model) continue;
        const response = sessionResponses[i];

        const workflowId = createWorkflow(model.modelId, model.keyId, true);
        workflowIds.push(workflowId);

        if (response) {
          responseMapRef.current.set(workflowId, response.id);
        }

        updateWorkflow(workflowId, {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'system',
              content: WEBDEV_SYSTEM_PROMPT,
              timestamp: new Date(),
            },
          ],
        });

        setWorkflowConfig(workflowId, WEBDEV_WORKFLOW_CONFIG);
      }

      if (workflowIds[0]) {
        setActiveWorkflowId(workflowIds[0]);
      }

      setGlobalPrompt(prompt);
      await startAllSyncedWorkflows();
    },
    [
      resetConversation,
      createWorkflow,
      updateWorkflow,
      setWorkflowConfig,
      setGlobalPrompt,
      setActiveWorkflowId,
      startAllSyncedWorkflows,
    ],
  );

  /**
   * Handle follow-up prompts (iterate on existing generation).
   *
   * 1. Snapshot current sandboxes into iteration history
   * 2. Create new iteration via PATCH API
   * 3. Update responseMapRef with new response IDs
   * 4. Reset sandboxes for new iteration
   * 5. Continue all synced workflows (preserves message history)
   */
  const handleFollowUp = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;
      if (!sessionId) return;

      // 1. Snapshot current iteration
      const { id: iterationId, version, prompt: iterationPrompt } = iterationRef.current;
      if (iterationId) {
        snapshotCurrentIteration(iterationId, version, iterationPrompt, responseMapRef.current);
      }

      // 2. Create new iteration via API
      const res = await fetch('/api/webdev/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, prompt }),
      });

      if (!res.ok) {
        setPhase('error');
        return;
      }

      const data = (await res.json()) as {
        iteration: { id: string; version: number; prompt: string };
        responses: Array<{ id: string; modelId: string; displayPosition: number }>;
      };

      // 3. Update iteration tracking
      iterationRef.current = {
        id: data.iteration.id,
        version: data.iteration.version,
        prompt: data.iteration.prompt,
      };

      // 4. Update responseMapRef — match by displayPosition order
      const workflowIds = [...responseMapRef.current.keys()];
      const sortedResponses = [...data.responses].sort(
        (a, b) => a.displayPosition - b.displayPosition,
      );
      responseMapRef.current.clear();
      for (let i = 0; i < workflowIds.length && i < sortedResponses.length; i++) {
        const wfId = workflowIds[i];
        const resp = sortedResponses[i];
        if (wfId && resp) {
          responseMapRef.current.set(wfId, resp.id);
        }
      }

      // 5. Reset sandboxes for new iteration (don't destroy — they're snapshotted)
      for (const wfId of workflowIds) {
        if (wfId) {
          initSandbox(wfId);
        }
      }

      // 6. Generate
      setPhase('generating');
      await continueAllSyncedWorkflows(prompt);
    },
    [sessionId, snapshotCurrentIteration, initSandbox, setPhase, continueAllSyncedWorkflows],
  );

  return {
    startGeneration,
    handleFollowUp,
    getResponseId,
  };
}
