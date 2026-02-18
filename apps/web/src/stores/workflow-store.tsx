'use client';

import { createContext, type ReactNode, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  type ArenaWorkflow,
  DEFAULT_WORKFLOW_CONFIG,
  type FileAttachment,
  type PendingResponse,
  type VideoAttachment,
  type WorkflowConfig,
  type WorkflowMessage,
  type WorkflowMetrics,
  type WorkflowStatus,
} from '@/types/workflow';

/**
 * Conversation data loaded from database
 */
export interface LoadedConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    type: 'image' | 'audio' | 'video' | 'file';
    fileId: string;
    mimeType: string;
    filename?: string;
    sizeBytes?: number;
  }> | null;
  createdAt: string;
  responses?: Array<{
    id: string;
    modelName: string;
    providerName: string;
    responseContent: string;
    attachments?: Array<{
      type: 'image' | 'audio' | 'video';
      key: string;
      mimeType: string;
      filename?: string;
      sizeBytes?: number;
      url?: string;
    }> | null;
    tokensUsed?: number;
    responseTimeMs?: number;
    displayPosition?: number;
  }>;
}

export interface LoadedConversation {
  conversation: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: LoadedConversationMessage[];
}

/**
 * New conversation info for sidebar optimistic update
 */
export interface NewConversationInfo {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * Workflow Store State
 */
export type WorkflowState = {
  /** Map of workflow ID to workflow instance */
  workflows: Map<string, ArenaWorkflow>;
  /** Array of workflow IDs in display order */
  workflowOrder: string[];
  /** Global prompt shared by synced workflows */
  globalPrompt: string;
  /** Current conversation ID (null for new conversations) */
  conversationId: string | null;
  /** Map of database message ID to workflow message ID */
  messageIdMap: Map<string, string>;
  /** New conversation info for sidebar optimistic update */
  newConversation: NewConversationInfo | null;
  /** Flag to indicate if a conversation is being created (to avoid triggering reload on URL update) */
  isCreatingConversation: boolean;
};

/**
 * Workflow Store Actions
 */
export type WorkflowActions = {
  // CRUD Operations
  createWorkflow: (modelId: string, keyId: string, synced?: boolean) => string;
  deleteWorkflow: (id: string) => void;
  updateWorkflow: (id: string, update: Partial<ArenaWorkflow>) => void;

  // Global prompt
  setGlobalPrompt: (prompt: string) => void;

  // Workflow configuration
  setWorkflowConfig: (id: string, config: Partial<WorkflowConfig>) => void;
  setWorkflowModel: (id: string, modelId: string, keyId: string) => void;
  toggleWorkflowSync: (id: string, synced: boolean) => void;
  setCustomPrompt: (id: string, prompt: string) => void;

  // Status management
  setWorkflowStatus: (id: string, status: WorkflowStatus, error?: string) => void;

  // Message management
  addUserMessage: (id: string, content: string, attachments?: FileAttachment[]) => string;
  addAssistantMessage: (
    id: string,
    content: string,
    metrics?: WorkflowMetrics,
    reasoning?: string,
  ) => string;

  // Streaming response management
  startPendingResponse: (id: string) => void;
  appendPendingResponse: (id: string, chunk: string) => void;
  appendPendingReasoning: (id: string, chunk: string) => void;
  completePendingResponse: (id: string, metrics?: WorkflowMetrics) => void;

  // Video generation management
  setVideoGenerating: (id: string, isGenerating: boolean) => void;
  completeVideoResponse: (id: string, video: VideoAttachment, metrics?: WorkflowMetrics) => void;

  // Abort controller management (for cancellation)
  setAbortController: (id: string, controller: AbortController | undefined) => void;
  getAbortController: (id: string) => AbortController | undefined;

  // History management
  clearWorkflowHistory: (id: string) => void;
  clearAllWorkflowHistory: () => void;
  removeLastAssistantMessage: (id: string) => string | undefined;

  // Bulk operations
  getWorkflow: (id: string) => ArenaWorkflow | undefined;
  getAllWorkflows: () => ArenaWorkflow[];
  getSyncedWorkflows: () => ArenaWorkflow[];

  // Global prompt (getter for closure-safe access)
  getGlobalPrompt: () => string;

  // Conversation management
  setConversationId: (id: string | null) => void;
  getConversationId: () => string | null;
  loadConversationHistory: (
    data: LoadedConversation,
    modelKeyMap: Map<string, { modelId: string; keyId: string }>,
  ) => void;
  resetConversation: () => void;
  setMessageIdMapping: (dbMessageId: string, workflowMessageId: string) => void;
  getDbMessageId: (workflowMessageId: string) => string | undefined;

  // New conversation notification for sidebar
  setNewConversation: (conversation: NewConversationInfo | null) => void;
  clearNewConversation: () => void;

  // Conversation creation flag management
  setIsCreatingConversation: (isCreating: boolean) => void;
};

export type WorkflowStore = WorkflowState & WorkflowActions;

/**
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Create an empty workflow instance
 */
function createEmptyWorkflow(
  id: string,
  modelId: string,
  keyId: string,
  synced = true,
): ArenaWorkflow {
  const now = new Date();
  return {
    id,
    modelId,
    keyId,
    status: 'pending',
    messages: [],
    config: { ...DEFAULT_WORKFLOW_CONFIG },
    synced,
    customPrompt: '',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Default initial state
 */
const defaultInitState: WorkflowState = {
  workflows: new Map(),
  workflowOrder: [],
  globalPrompt: '',
  conversationId: null,
  messageIdMap: new Map(),
  newConversation: null,
  isCreatingConversation: false,
};

/**
 * Store for AbortControllers (not serializable, kept outside Zustand state)
 */
const abortControllers = new Map<string, AbortController>();

/**
 * Create the Workflow Store
 */
export const createWorkflowStore = (initState: Partial<WorkflowState> = {}) => {
  return createStore<WorkflowStore>()(
    devtools(
      (set, get) => ({
        ...defaultInitState,
        ...initState,

        createWorkflow: (modelId, keyId, synced = true) => {
          const id = generateId();
          set(
            (state) => {
              const newMap = new Map(state.workflows);
              newMap.set(id, createEmptyWorkflow(id, modelId, keyId, synced));

              const newOrder = [...state.workflowOrder, id];

              return { workflows: newMap, workflowOrder: newOrder };
            },
            false,
            'workflow/create',
          );
          return id;
        },

        deleteWorkflow: (id) => {
          const controller = abortControllers.get(id);
          if (controller) {
            controller.abort();
            abortControllers.delete(id);
          }

          set(
            (state) => {
              const newMap = new Map(state.workflows);
              newMap.delete(id);

              const newOrder = state.workflowOrder.filter((wfId) => wfId !== id);

              return { workflows: newMap, workflowOrder: newOrder };
            },
            false,
            'workflow/delete',
          );
        },

        updateWorkflow: (id, update) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                ...update,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/update',
          );
        },

        setGlobalPrompt: (prompt) => {
          set({ globalPrompt: prompt }, false, 'workflow/setGlobalPrompt');
        },

        setWorkflowConfig: (id, config) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                config: { ...workflow.config, ...config },
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/setConfig',
          );
        },

        setWorkflowModel: (id, modelId, keyId) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                modelId,
                keyId,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/setModel',
          );
        },

        toggleWorkflowSync: (id, synced) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                synced,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/toggleSync',
          );
        },

        setCustomPrompt: (id, prompt) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                customPrompt: prompt,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/setCustomPrompt',
          );
        },

        setWorkflowStatus: (id, status, error) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                status,
                error: error ?? (status === 'failed' ? workflow.error : undefined),
                pendingResponse: status === 'cancelled' ? undefined : workflow.pendingResponse,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/setStatus',
          );
        },

        addUserMessage: (id, content, attachments) => {
          const messageId = generateId();
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const message: WorkflowMessage = {
                id: messageId,
                role: 'user',
                content,
                timestamp: new Date(),
                attachments,
              };

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                messages: [...workflow.messages, message],
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/addUserMessage',
          );
          return messageId;
        },

        addAssistantMessage: (id, content, metrics, reasoning) => {
          const messageId = generateId();
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const message: WorkflowMessage = {
                id: messageId,
                role: 'assistant',
                content,
                reasoning,
                timestamp: new Date(),
                metrics: metrics
                  ? {
                      responseTime: metrics.totalTime,
                      tokenCount: metrics.totalTokens,
                      timeToFirstToken: metrics.timeToFirstToken,
                      tokensPerSecond: metrics.tokensPerSecond,
                    }
                  : undefined,
              };

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                messages: [...workflow.messages, message],
                metrics,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/addAssistantMessage',
          );
          return messageId;
        },

        startPendingResponse: (id) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const pendingResponse: PendingResponse = {
                content: '',
                startTime: Date.now(),
              };

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                pendingResponse,
                status: 'running',
                error: undefined,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/startPendingResponse',
          );
        },

        appendPendingResponse: (id, chunk) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow || !workflow.pendingResponse) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                pendingResponse: {
                  ...workflow.pendingResponse,
                  content: workflow.pendingResponse.content + chunk,
                },
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/appendPendingResponse',
          );
        },

        appendPendingReasoning: (id, chunk) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow || !workflow.pendingResponse) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                pendingResponse: {
                  ...workflow.pendingResponse,
                  reasoning: (workflow.pendingResponse.reasoning || '') + chunk,
                },
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/appendPendingReasoning',
          );
        },

        completePendingResponse: (id, metrics) => {
          const state = get();
          const workflow = state.workflows.get(id);
          if (!workflow || !workflow.pendingResponse) return;

          get().addAssistantMessage(
            id,
            workflow.pendingResponse.content,
            metrics,
            workflow.pendingResponse.reasoning,
          );

          set(
            (s) => {
              const w = s.workflows.get(id);
              if (!w) return s;

              const newMap = new Map(s.workflows);
              newMap.set(id, {
                ...w,
                pendingResponse: undefined,
                status: 'completed',
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/completePendingResponse',
          );
        },

        setVideoGenerating: (id, isGenerating) => {
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                pendingResponse: isGenerating
                  ? {
                      content: '',
                      startTime: Date.now(),
                      isVideoGenerating: true,
                    }
                  : undefined,
                status: isGenerating ? 'running' : workflow.status,
                error: isGenerating ? undefined : workflow.error,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/setVideoGenerating',
          );
        },

        completeVideoResponse: (id, video, metrics) => {
          const messageId = generateId();
          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const message: WorkflowMessage = {
                id: messageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                videoAttachment: video,
                metrics: metrics
                  ? {
                      responseTime: metrics.totalTime,
                    }
                  : undefined,
              };

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                messages: [...workflow.messages, message],
                pendingResponse: undefined,
                status: 'completed',
                metrics,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/completeVideoResponse',
          );
        },

        setAbortController: (id, controller) => {
          if (controller) {
            abortControllers.set(id, controller);
          } else {
            abortControllers.delete(id);
          }
        },

        getAbortController: (id) => {
          return abortControllers.get(id);
        },

        clearWorkflowHistory: (id) => {
          const controller = abortControllers.get(id);
          if (controller) {
            controller.abort();
            abortControllers.delete(id);
          }

          set(
            (state) => {
              const workflow = state.workflows.get(id);
              if (!workflow) return state;

              const newMap = new Map(state.workflows);
              newMap.set(id, {
                ...workflow,
                messages: [],
                pendingResponse: undefined,
                status: 'pending',
                error: undefined,
                metrics: undefined,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/clearHistory',
          );
        },

        clearAllWorkflowHistory: () => {
          for (const [_id, controller] of abortControllers) {
            controller.abort();
          }
          abortControllers.clear();

          set(
            (state) => {
              const newMap = new Map<string, ArenaWorkflow>();
              for (const [id, workflow] of state.workflows) {
                newMap.set(id, {
                  ...workflow,
                  messages: [],
                  pendingResponse: undefined,
                  status: 'pending',
                  error: undefined,
                  metrics: undefined,
                  updatedAt: new Date(),
                });
              }
              return { workflows: newMap };
            },
            false,
            'workflow/clearAllHistory',
          );
        },

        removeLastAssistantMessage: (id) => {
          const state = get();
          const workflow = state.workflows.get(id);
          if (!workflow) return undefined;

          const lastAssistantIndex = workflow.messages.findLastIndex((m) => m.role === 'assistant');
          if (lastAssistantIndex === -1) return undefined;

          const userMessageIndex = lastAssistantIndex - 1;
          const userMessage =
            userMessageIndex >= 0 ? workflow.messages[userMessageIndex] : undefined;
          const userContent = userMessage?.role === 'user' ? userMessage.content : undefined;

          set(
            (s) => {
              const w = s.workflows.get(id);
              if (!w) return s;

              const newMessages = w.messages.slice(0, lastAssistantIndex);

              const newMap = new Map(s.workflows);
              newMap.set(id, {
                ...w,
                messages: newMessages,
                pendingResponse: undefined,
                status: 'pending',
                error: undefined,
                updatedAt: new Date(),
              });
              return { workflows: newMap };
            },
            false,
            'workflow/removeLastAssistantMessage',
          );

          return userContent;
        },

        getWorkflow: (id) => {
          return get().workflows.get(id);
        },

        getAllWorkflows: () => {
          return Array.from(get().workflows.values());
        },

        getSyncedWorkflows: () => {
          return Array.from(get().workflows.values()).filter((w) => w.synced);
        },

        getGlobalPrompt: () => {
          return get().globalPrompt;
        },

        setConversationId: (id) => {
          set({ conversationId: id }, false, 'workflow/setConversationId');
        },

        getConversationId: () => {
          return get().conversationId;
        },

        loadConversationHistory: (data, modelKeyMap) => {
          const { messages } = data;

          const newWorkflows = new Map<string, ArenaWorkflow>();
          const newMessageIdMap = new Map<string, string>();

          const modelKeyToWorkflowId = new Map<string, string>();
          for (const [modelKey, { modelId, keyId }] of modelKeyMap) {
            const workflowId = generateId();
            const workflow = createEmptyWorkflow(workflowId, modelId, keyId, true);
            newWorkflows.set(workflowId, workflow);
            modelKeyToWorkflowId.set(modelKey, workflowId);
          }

          const sortedModelKeys = Array.from(modelKeyMap.keys()).sort((a, b) => {
            const posA = Number.parseInt(a.split(':').pop() ?? '999', 10);
            const posB = Number.parseInt(b.split(':').pop() ?? '999', 10);
            return posA - posB;
          });
          const sortedWorkflowIds = sortedModelKeys
            .map((modelKey) => modelKeyToWorkflowId.get(modelKey))
            .filter((id): id is string => id !== undefined);

          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg) continue;

            if (msg.role === 'user') {
              const workflowMessageId = generateId();
              newMessageIdMap.set(msg.id, workflowMessageId);

              const fileAttachments: FileAttachment[] | undefined = msg.attachments
                ?.filter((att) => att.fileId)
                .map((att) => ({
                  type: 'file' as const,
                  url: '',
                  mediaType: att.mimeType,
                  filename: att.filename || 'attachment',
                  fileId: att.fileId,
                }));

              const userMessage: WorkflowMessage = {
                id: workflowMessageId,
                role: 'user',
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                attachments:
                  fileAttachments && fileAttachments.length > 0 ? fileAttachments : undefined,
              };

              for (const [workflowId, workflow] of newWorkflows) {
                newWorkflows.set(workflowId, {
                  ...workflow,
                  messages: [...workflow.messages, userMessage],
                  status: 'completed',
                  updatedAt: new Date(),
                });
              }

              if (msg.responses) {
                for (const response of msg.responses) {
                  const modelKey = `${response.providerName}:${response.modelName}:${response.displayPosition ?? 0}`;
                  const workflowId = modelKeyToWorkflowId.get(modelKey);
                  const workflow = workflowId ? newWorkflows.get(workflowId) : undefined;

                  if (workflow && workflowId) {
                    const videoAttachment = response.attachments?.find(
                      (att) => att.type === 'video',
                    );

                    const assistantMessage: WorkflowMessage = {
                      id: generateId(),
                      role: 'assistant',
                      content: response.responseContent,
                      timestamp: new Date(msg.createdAt),
                      metrics: response.responseTimeMs
                        ? {
                            responseTime: response.responseTimeMs,
                            tokenCount: response.tokensUsed,
                          }
                        : undefined,
                      videoAttachment: videoAttachment
                        ? {
                            url: videoAttachment.url || '',
                            mimeType: videoAttachment.mimeType,
                          }
                        : undefined,
                    };

                    newWorkflows.set(workflowId, {
                      ...workflow,
                      messages: [...workflow.messages, assistantMessage],
                    });
                  }
                }
              }
            }
          }

          set(
            {
              workflows: newWorkflows,
              workflowOrder: sortedWorkflowIds,
              conversationId: data.conversation.id,
              messageIdMap: newMessageIdMap,
            },
            false,
            'workflow/loadConversationHistory',
          );
        },

        resetConversation: () => {
          for (const [_id, controller] of abortControllers) {
            controller.abort();
          }
          abortControllers.clear();

          set(
            {
              workflows: new Map(),
              workflowOrder: [],
              globalPrompt: '',
              conversationId: null,
              messageIdMap: new Map(),
              newConversation: null,
              isCreatingConversation: false,
            },
            false,
            'workflow/resetConversation',
          );
        },

        setMessageIdMapping: (dbMessageId, workflowMessageId) => {
          set(
            (state) => {
              const newMap = new Map(state.messageIdMap);
              newMap.set(dbMessageId, workflowMessageId);
              return { messageIdMap: newMap };
            },
            false,
            'workflow/setMessageIdMapping',
          );
        },

        getDbMessageId: (workflowMessageId) => {
          const state = get();
          for (const [dbId, wfId] of state.messageIdMap) {
            if (wfId === workflowMessageId) {
              return dbId;
            }
          }
          return undefined;
        },

        setNewConversation: (conversation) => {
          set(
            { newConversation: conversation, isCreatingConversation: true },
            false,
            'workflow/setNewConversation',
          );
        },

        clearNewConversation: () => {
          set({ newConversation: null }, false, 'workflow/clearNewConversation');
        },

        setIsCreatingConversation: (isCreating) => {
          set({ isCreatingConversation: isCreating }, false, 'workflow/setIsCreatingConversation');
        },
      }),
      { name: 'workflow-store', enabled: process.env.NODE_ENV === 'development' },
    ),
  );
};

type WorkflowStoreApi = ReturnType<typeof createWorkflowStore>;

const WorkflowStoreContext = createContext<WorkflowStoreApi | null>(null);

export function WorkflowStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<WorkflowStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createWorkflowStore();
  }

  return (
    <WorkflowStoreContext.Provider value={storeRef.current}>
      {children}
    </WorkflowStoreContext.Provider>
  );
}

export function useWorkflowStore<T>(selector: (state: WorkflowStore) => T): T {
  const store = useContext(WorkflowStoreContext);
  if (!store) {
    throw new Error('useWorkflowStore must be used within WorkflowStoreProvider');
  }
  return useStore(store, selector);
}

export function useWorkflowStoreShallow<T>(selector: (state: WorkflowStore) => T): T {
  const store = useContext(WorkflowStoreContext);
  if (!store) {
    throw new Error('useWorkflowStoreShallow must be used within WorkflowStoreProvider');
  }
  return useStore(store, useShallow(selector));
}

/**
 * Pre-defined selectors for common use cases
 */
export const workflowSelectors = {
  workflows: (state: WorkflowStore) => state.workflows,
  workflowOrder: (state: WorkflowStore) => state.workflowOrder,
  globalPrompt: (state: WorkflowStore) => state.globalPrompt,
  workflowCount: (state: WorkflowStore) => state.workflows.size,
  isAnyRunning: (state: WorkflowStore) =>
    Array.from(state.workflows.values()).some((w) => w.status === 'running'),
  allWorkflows: (state: WorkflowStore) => Array.from(state.workflows.values()),
  syncedWorkflows: (state: WorkflowStore) =>
    Array.from(state.workflows.values()).filter((w) => w.synced),
  conversationId: (state: WorkflowStore) => state.conversationId,
  messageIdMap: (state: WorkflowStore) => state.messageIdMap,
  hasConversation: (state: WorkflowStore) => state.conversationId !== null,
  newConversation: (state: WorkflowStore) => state.newConversation,
  isCreatingConversation: (state: WorkflowStore) => state.isCreatingConversation,

  workflowState: (state: WorkflowStore) => ({
    workflows: state.workflows,
    workflowOrder: state.workflowOrder,
    globalPrompt: state.globalPrompt,
    isAnyRunning: Array.from(state.workflows.values()).some((w) => w.status === 'running'),
    conversationId: state.conversationId,
    isCreatingConversation: state.isCreatingConversation,
  }),

  workflowActions: (state: WorkflowStore) => ({
    createWorkflow: state.createWorkflow,
    deleteWorkflow: state.deleteWorkflow,
    setGlobalPrompt: state.setGlobalPrompt,
    getGlobalPrompt: state.getGlobalPrompt,
    toggleWorkflowSync: state.toggleWorkflowSync,
    setWorkflowConfig: state.setWorkflowConfig,
    setCustomPrompt: state.setCustomPrompt,
    clearWorkflowHistory: state.clearWorkflowHistory,
    resetConversation: state.resetConversation,
    loadConversationHistory: state.loadConversationHistory,
    setConversationId: state.setConversationId,
    getConversationId: state.getConversationId,
    setNewConversation: state.setNewConversation,
    setIsCreatingConversation: state.setIsCreatingConversation,
  }),
};
