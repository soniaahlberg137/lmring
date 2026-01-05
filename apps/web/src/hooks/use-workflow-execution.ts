import { useCallback, useRef } from 'react';
import { buildWorkflowStreamRequest, streamWorkflow } from '@/libs/workflow-api';
import { useWorkflowStore } from '@/stores/workflow-store';
import type { ArenaWorkflow, WorkflowImageAttachment, WorkflowMetrics } from '@/types/workflow';

export interface WorkflowPersistenceCallbacks {
  onCreateConversation?: (title: string) => Promise<string | null>;
  onSaveUserMessage?: (conversationId: string, content: string) => Promise<string | null>;
  onSaveModelResponse?: (
    workflowId: string,
    messageId: string,
    modelName: string,
    providerName: string,
    responseContent: string,
    tokensUsed?: number,
    responseTimeMs?: number,
  ) => Promise<void>;
  onConversationCreated?: (conversationId: string, title: string) => void;
}

export function useWorkflowExecution(persistenceCallbacks?: WorkflowPersistenceCallbacks) {
  const addUserMessage = useWorkflowStore((s) => s.addUserMessage);
  const startPendingResponse = useWorkflowStore((s) => s.startPendingResponse);
  const appendPendingResponse = useWorkflowStore((s) => s.appendPendingResponse);
  const appendPendingReasoning = useWorkflowStore((s) => s.appendPendingReasoning);
  const completePendingResponse = useWorkflowStore((s) => s.completePendingResponse);
  const setWorkflowStatus = useWorkflowStore((s) => s.setWorkflowStatus);
  const setAbortController = useWorkflowStore((s) => s.setAbortController);
  const getAbortController = useWorkflowStore((s) => s.getAbortController);
  const getWorkflow = useWorkflowStore((s) => s.getWorkflow);
  const getSyncedWorkflows = useWorkflowStore((s) => s.getSyncedWorkflows);
  const globalPrompt = useWorkflowStore((s) => s.globalPrompt);
  const clearWorkflowHistory = useWorkflowStore((s) => s.clearWorkflowHistory);
  const removeLastAssistantMessage = useWorkflowStore((s) => s.removeLastAssistantMessage);
  const getConversationId = useWorkflowStore((s) => s.getConversationId);
  const setConversationId = useWorkflowStore((s) => s.setConversationId);

  const currentDbMessageIdRef = useRef<string | null>(null);

  const conversationCreationPromiseRef = useRef<Promise<{
    conversationId: string;
    messageId: string;
  } | null> | null>(null);
  const pendingPromptRef = useRef<string>('');

  const createConversationOnFirstChunk = useCallback(async (): Promise<{
    conversationId: string;
    messageId: string;
  } | null> => {
    const existingConversationId = getConversationId();
    if (existingConversationId && persistenceCallbacks?.onSaveUserMessage) {
      const messageId = await persistenceCallbacks.onSaveUserMessage(
        existingConversationId,
        pendingPromptRef.current,
      );
      if (messageId) {
        return { conversationId: existingConversationId, messageId };
      }
      return null;
    }

    if (!persistenceCallbacks?.onCreateConversation) return null;

    const prompt = pendingPromptRef.current;
    const title = prompt.trim().slice(0, 50) + (prompt.length > 50 ? '...' : '');
    const conversationId = await persistenceCallbacks.onCreateConversation(title);

    if (!conversationId) return null;

    setConversationId(conversationId);

    let messageId: string | null = null;
    if (persistenceCallbacks.onSaveUserMessage) {
      messageId = await persistenceCallbacks.onSaveUserMessage(conversationId, prompt);
    }

    persistenceCallbacks.onConversationCreated?.(conversationId, title);

    return messageId ? { conversationId, messageId } : null;
  }, [getConversationId, setConversationId, persistenceCallbacks]);

  const executeWorkflowStream = useCallback(
    async (
      workflow: ArenaWorkflow,
      prompt: string,
      options?: {
        isNewConversation?: boolean;
        existingDbMessageId?: string;
        attachments?: WorkflowImageAttachment[];
      },
    ) => {
      const { id, modelId, keyId, messages, config } = workflow;
      const { isNewConversation = false, existingDbMessageId, attachments } = options || {};

      addUserMessage(id, prompt);
      startPendingResponse(id);

      const abortController = new AbortController();
      setAbortController(id, abortController);

      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: prompt },
      ];

      const request = buildWorkflowStreamRequest(
        id,
        modelId,
        keyId,
        allMessages,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          ...(config.topP != null && { topP: config.topP }),
          ...(config.frequencyPenalty != null && { frequencyPenalty: config.frequencyPenalty }),
          ...(config.presencePenalty != null && { presencePenalty: config.presencePenalty }),
        },
        attachments,
      );

      let metrics: WorkflowMetrics | undefined;
      let finalContent = '';
      let dbMessageId = existingDbMessageId;
      let isFirstChunk = true;

      try {
        for await (const event of streamWorkflow(request, abortController.signal)) {
          if (event.type === 'chunk' && event.chunk) {
            if (isFirstChunk && isNewConversation && persistenceCallbacks) {
              isFirstChunk = false;

              if (!conversationCreationPromiseRef.current) {
                conversationCreationPromiseRef.current = createConversationOnFirstChunk();
              }

              const result = await conversationCreationPromiseRef.current;
              if (result) {
                dbMessageId = result.messageId;
                currentDbMessageIdRef.current = result.messageId;
              }
            }

            appendPendingResponse(id, event.chunk);
            finalContent += event.chunk;
          } else if (event.type === 'reasoning' && event.reasoning) {
            appendPendingReasoning(id, event.reasoning);
          } else if (event.type === 'complete') {
            metrics = event.metrics;
          } else if (event.type === 'error') {
            setWorkflowStatus(id, 'failed', event.error);
            setAbortController(id, undefined);
            return;
          }
        }

        completePendingResponse(id, metrics);
        setAbortController(id, undefined);

        if (dbMessageId && persistenceCallbacks?.onSaveModelResponse && finalContent) {
          const [providerName, modelName] = modelId.split(':');
          try {
            await persistenceCallbacks.onSaveModelResponse(
              id,
              dbMessageId,
              modelName || modelId,
              providerName || 'unknown',
              finalContent,
              metrics?.totalTokens,
              metrics?.totalTime,
            );
          } catch (error) {
            console.error('Failed to save model response:', error);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setWorkflowStatus(id, 'cancelled');
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setWorkflowStatus(id, 'failed', errorMessage);
        }
        setAbortController(id, undefined);
      }
    },
    [
      addUserMessage,
      startPendingResponse,
      appendPendingResponse,
      appendPendingReasoning,
      completePendingResponse,
      setWorkflowStatus,
      setAbortController,
      persistenceCallbacks,
      createConversationOnFirstChunk,
    ],
  );

  const startWorkflow = useCallback(
    async (workflowId: string, prompt: string) => {
      const workflow = getWorkflow(workflowId);
      if (!workflow) {
        console.error('Workflow not found:', workflowId);
        return;
      }

      if (workflow.status === 'running') {
        console.warn('Workflow already running:', workflowId);
        return;
      }

      if (!prompt.trim()) {
        console.warn('Empty prompt provided');
        return;
      }

      await executeWorkflowStream(workflow, prompt);
    },
    [getWorkflow, executeWorkflowStream],
  );

  const continueWorkflow = useCallback(
    async (workflowId: string, followUpPrompt: string) => {
      const workflow = getWorkflow(workflowId);
      if (!workflow) {
        console.error('Workflow not found:', workflowId);
        return;
      }

      if (workflow.status === 'running') {
        console.warn('Workflow already running:', workflowId);
        return;
      }

      if (!followUpPrompt.trim()) {
        console.warn('Empty follow-up prompt provided');
        return;
      }

      await executeWorkflowStream(workflow, followUpPrompt);
    },
    [getWorkflow, executeWorkflowStream],
  );

  const cancelWorkflow = useCallback(
    (workflowId: string) => {
      const controller = getAbortController(workflowId);
      if (controller) {
        controller.abort();
        setAbortController(workflowId, undefined);
        setWorkflowStatus(workflowId, 'cancelled');
      }
    },
    [getAbortController, setAbortController, setWorkflowStatus],
  );

  const retryWorkflow = useCallback(
    async (workflowId: string) => {
      const workflow = getWorkflow(workflowId);
      if (!workflow) {
        console.error('Workflow not found:', workflowId);
        return;
      }

      if (workflow.status !== 'failed' && workflow.status !== 'cancelled') {
        console.warn('Can only retry failed or cancelled workflows');
        return;
      }

      const lastUserMessage = [...workflow.messages].reverse().find((m) => m.role === 'user');
      if (!lastUserMessage) {
        console.warn('No user message to retry');
        return;
      }

      clearWorkflowHistory(workflowId);

      const freshWorkflow = getWorkflow(workflowId);
      if (freshWorkflow) {
        await executeWorkflowStream(freshWorkflow, lastUserMessage.content);
      }
    },
    [getWorkflow, clearWorkflowHistory, executeWorkflowStream],
  );

  const regenerateLastResponse = useCallback(
    async (workflowId: string) => {
      const workflow = getWorkflow(workflowId);
      if (!workflow) {
        console.error('Workflow not found:', workflowId);
        return;
      }

      if (workflow.status === 'running') {
        console.warn('Workflow is currently running:', workflowId);
        return;
      }

      const userContent = removeLastAssistantMessage(workflowId);
      if (!userContent) {
        console.warn('No user message found to regenerate response');
        return;
      }

      const freshWorkflow = getWorkflow(workflowId);
      if (freshWorkflow) {
        await executeWorkflowStream(freshWorkflow, userContent);
      }
    },
    [getWorkflow, removeLastAssistantMessage, executeWorkflowStream],
  );

  const startAllSyncedWorkflows = useCallback(
    async (attachments?: WorkflowImageAttachment[]) => {
      if (!globalPrompt.trim()) {
        console.warn('Empty global prompt');
        return;
      }

      const syncedWorkflows = getSyncedWorkflows();
      const runnableWorkflows = syncedWorkflows.filter((w) => w.status !== 'running');

      if (runnableWorkflows.length === 0) {
        console.warn('No runnable synced workflows');
        return;
      }

      const existingConversationId = getConversationId();
      const isNewConversation = !existingConversationId;

      conversationCreationPromiseRef.current = null;
      pendingPromptRef.current = globalPrompt;

      let existingDbMessageId: string | undefined;
      if (existingConversationId && persistenceCallbacks?.onSaveUserMessage) {
        const messageId = await persistenceCallbacks.onSaveUserMessage(
          existingConversationId,
          globalPrompt,
        );
        if (messageId) {
          existingDbMessageId = messageId;
          currentDbMessageIdRef.current = messageId;
        }
      }

      await Promise.all(
        runnableWorkflows.map((w) =>
          executeWorkflowStream(w, globalPrompt, {
            isNewConversation,
            existingDbMessageId,
            attachments,
          }),
        ),
      );
    },
    [
      globalPrompt,
      getSyncedWorkflows,
      executeWorkflowStream,
      persistenceCallbacks,
      getConversationId,
    ],
  );

  const continueAllSyncedWorkflows = useCallback(
    async (followUpPrompt: string) => {
      if (!followUpPrompt.trim()) {
        console.warn('Empty follow-up prompt');
        return;
      }

      const syncedWorkflows = getSyncedWorkflows();
      const runnableWorkflows = syncedWorkflows.filter((w) => w.status !== 'running');

      if (runnableWorkflows.length === 0) {
        console.warn('No runnable synced workflows');
        return;
      }

      await Promise.all(runnableWorkflows.map((w) => executeWorkflowStream(w, followUpPrompt)));
    },
    [getSyncedWorkflows, executeWorkflowStream],
  );

  const cancelAllWorkflows = useCallback(() => {
    const syncedWorkflows = getSyncedWorkflows();
    const runningWorkflows = syncedWorkflows.filter((w) => w.status === 'running');

    for (const workflow of runningWorkflows) {
      cancelWorkflow(workflow.id);
    }
  }, [getSyncedWorkflows, cancelWorkflow]);

  return {
    startWorkflow,
    continueWorkflow,
    cancelWorkflow,
    retryWorkflow,
    regenerateLastResponse,
    startAllSyncedWorkflows,
    continueAllSyncedWorkflows,
    cancelAllWorkflows,
  };
}
