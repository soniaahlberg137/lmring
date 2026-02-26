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
  const destroyAllSandboxes = useWebDevStore((s) => s.destroyAllSandboxes);

  const { startAllSyncedWorkflows, continueAllSyncedWorkflows } = useWorkflowExecution();

  /** Maps workflowId -> responseId (DB record) for sandbox creation */
  const responseMapRef = useRef<Map<string, string>>(new Map());

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
    async ({ prompt, models, sessionResponses }: StartGenerationParams) => {
      resetConversation();
      responseMapRef.current.clear();

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
   * 1. Destroy existing sandboxes (new code will be generated)
   * 2. Set phase back to 'generating'
   * 3. Continue all synced workflows with the follow-up prompt
   */
  const handleFollowUp = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      await destroyAllSandboxes();
      setPhase('generating');
      await continueAllSyncedWorkflows(prompt);
    },
    [destroyAllSandboxes, setPhase, continueAllSyncedWorkflows],
  );

  return {
    startGeneration,
    handleFollowUp,
    getResponseId,
  };
}
