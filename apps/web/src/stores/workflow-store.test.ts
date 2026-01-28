import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkflowStore, type LoadedConversation, workflowSelectors } from './workflow-store';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).substring(2, 9)}`),
});

describe('workflow-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty workflows map', () => {
      const store = createWorkflowStore();
      expect(store.getState().workflows.size).toBe(0);
    });

    it('should have empty workflowOrder', () => {
      const store = createWorkflowStore();
      expect(store.getState().workflowOrder).toEqual([]);
    });

    it('should have empty globalPrompt', () => {
      const store = createWorkflowStore();
      expect(store.getState().globalPrompt).toBe('');
    });

    it('should have null conversationId', () => {
      const store = createWorkflowStore();
      expect(store.getState().conversationId).toBeNull();
    });

    it('should have empty messageIdMap', () => {
      const store = createWorkflowStore();
      expect(store.getState().messageIdMap.size).toBe(0);
    });

    it('should have null newConversation', () => {
      const store = createWorkflowStore();
      expect(store.getState().newConversation).toBeNull();
    });

    it('should have isCreatingConversation as false', () => {
      const store = createWorkflowStore();
      expect(store.getState().isCreatingConversation).toBe(false);
    });

    it('should accept initial state', () => {
      const store = createWorkflowStore({
        globalPrompt: 'Test',
        conversationId: 'conv-1',
      });

      expect(store.getState().globalPrompt).toBe('Test');
      expect(store.getState().conversationId).toBe('conv-1');
    });
  });

  describe('createWorkflow', () => {
    it('should create a new workflow', () => {
      const store = createWorkflowStore();

      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      expect(id).toBeDefined();
      expect(store.getState().workflows.size).toBe(1);
      expect(store.getState().workflowOrder).toContain(id);
    });

    it('should create workflow with correct default values', () => {
      const store = createWorkflowStore();

      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.modelId).toBe('openai:gpt-4');
      expect(workflow?.keyId).toBe('key-1');
      expect(workflow?.status).toBe('pending');
      expect(workflow?.messages).toEqual([]);
      expect(workflow?.synced).toBe(true);
      expect(workflow?.customPrompt).toBe('');
    });

    it('should create workflow with synced=false when specified', () => {
      const store = createWorkflowStore();

      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1', false);

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.synced).toBe(false);
    });

    it('should maintain workflow order', () => {
      const store = createWorkflowStore();

      const id1 = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      const id2 = store.getState().createWorkflow('anthropic:claude-3', 'key-2');

      expect(store.getState().workflowOrder).toEqual([id1, id2]);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete a workflow', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().deleteWorkflow(id);

      expect(store.getState().workflows.size).toBe(0);
      expect(store.getState().workflowOrder).not.toContain(id);
    });

    it('should abort controller when deleting', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      const mockController = { abort: vi.fn() } as unknown as AbortController;
      store.getState().setAbortController(id, mockController);

      store.getState().deleteWorkflow(id);

      expect(mockController.abort).toHaveBeenCalled();
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow fields', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().updateWorkflow(id, { customPrompt: 'Updated prompt' });

      expect(store.getState().workflows.get(id)?.customPrompt).toBe('Updated prompt');
    });

    it('should update updatedAt timestamp', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      const beforeUpdate = store.getState().workflows.get(id)?.updatedAt;

      store.getState().updateWorkflow(id, { customPrompt: 'Updated' });

      const afterUpdate = store.getState().workflows.get(id)?.updatedAt;
      expect(afterUpdate?.getTime()).toBeGreaterThanOrEqual(beforeUpdate?.getTime() || 0);
    });

    it('should do nothing for non-existent workflow', () => {
      const store = createWorkflowStore();

      store.getState().updateWorkflow('non-existent', { customPrompt: 'Test' });

      expect(store.getState().workflows.size).toBe(0);
    });
  });

  describe('setGlobalPrompt', () => {
    it('should set global prompt', () => {
      const store = createWorkflowStore();

      store.getState().setGlobalPrompt('Test prompt');

      expect(store.getState().globalPrompt).toBe('Test prompt');
    });
  });

  describe('setWorkflowConfig', () => {
    it('should update workflow config', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setWorkflowConfig(id, { temperature: 0.5 });

      expect(store.getState().workflows.get(id)?.config.temperature).toBe(0.5);
    });

    it('should merge with existing config', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setWorkflowConfig(id, { temperature: 0.5 });
      store.getState().setWorkflowConfig(id, { maxTokens: 4096 });

      const config = store.getState().workflows.get(id)?.config;
      expect(config?.temperature).toBe(0.5);
      expect(config?.maxTokens).toBe(4096);
    });
  });

  describe('setWorkflowModel', () => {
    it('should update model and key', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setWorkflowModel(id, 'anthropic:claude-3', 'key-2');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.modelId).toBe('anthropic:claude-3');
      expect(workflow?.keyId).toBe('key-2');
    });
  });

  describe('toggleWorkflowSync', () => {
    it('should toggle sync state', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().toggleWorkflowSync(id, false);

      expect(store.getState().workflows.get(id)?.synced).toBe(false);
    });
  });

  describe('setCustomPrompt', () => {
    it('should set custom prompt', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setCustomPrompt(id, 'Custom prompt');

      expect(store.getState().workflows.get(id)?.customPrompt).toBe('Custom prompt');
    });
  });

  describe('message management', () => {
    describe('addUserMessage', () => {
      it('should add user message to workflow', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        const messageId = store.getState().addUserMessage(id, 'Hello');

        expect(messageId).toBeDefined();
        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages).toHaveLength(1);
        expect(workflow?.messages[0]?.role).toBe('user');
        expect(workflow?.messages[0]?.content).toBe('Hello');
      });

      it('should add user message with attachments', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        const attachments = [
          {
            type: 'file' as const,
            url: 'http://example.com',
            mediaType: 'image/png',
            filename: 'test.png',
          },
        ];

        store.getState().addUserMessage(id, 'With attachment', attachments);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages[0]?.attachments).toEqual(attachments);
      });
    });

    describe('addAssistantMessage', () => {
      it('should add assistant message to workflow', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        const messageId = store.getState().addAssistantMessage(id, 'Response');

        expect(messageId).toBeDefined();
        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages).toHaveLength(1);
        expect(workflow?.messages[0]?.role).toBe('assistant');
        expect(workflow?.messages[0]?.content).toBe('Response');
      });

      it('should add assistant message with metrics', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        const metrics = {
          totalTime: 1500,
          totalTokens: 100,
          timeToFirstToken: 200,
          tokensPerSecond: 10,
        };

        store.getState().addAssistantMessage(id, 'Response', metrics);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages[0]?.metrics?.responseTime).toBe(1500);
        expect(workflow?.messages[0]?.metrics?.tokenCount).toBe(100);
      });

      it('should add assistant message with reasoning', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        store.getState().addAssistantMessage(id, 'Response', undefined, 'Thinking...');

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages[0]?.reasoning).toBe('Thinking...');
      });
    });
  });

  describe('streaming response management', () => {
    describe('startPendingResponse', () => {
      it('should start pending response', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        store.getState().startPendingResponse(id);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.pendingResponse).toBeDefined();
        expect(workflow?.pendingResponse?.content).toBe('');
        expect(workflow?.status).toBe('running');
        expect(workflow?.error).toBeUndefined();
      });
    });

    describe('appendPendingResponse', () => {
      it('should append to pending response', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().startPendingResponse(id);

        store.getState().appendPendingResponse(id, 'Hello ');
        store.getState().appendPendingResponse(id, 'World');

        expect(store.getState().workflows.get(id)?.pendingResponse?.content).toBe('Hello World');
      });

      it('should do nothing if no pending response', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        store.getState().appendPendingResponse(id, 'Test');

        expect(store.getState().workflows.get(id)?.pendingResponse).toBeUndefined();
      });
    });

    describe('appendPendingReasoning', () => {
      it('should append to pending reasoning', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().startPendingResponse(id);

        store.getState().appendPendingReasoning(id, 'Thinking ');
        store.getState().appendPendingReasoning(id, 'more');

        expect(store.getState().workflows.get(id)?.pendingResponse?.reasoning).toBe(
          'Thinking more',
        );
      });
    });

    describe('completePendingResponse', () => {
      it('should complete pending response and add message', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().startPendingResponse(id);
        store.getState().appendPendingResponse(id, 'Complete response');

        store.getState().completePendingResponse(id);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.pendingResponse).toBeUndefined();
        expect(workflow?.status).toBe('completed');
        expect(workflow?.messages).toHaveLength(1);
        expect(workflow?.messages[0]?.content).toBe('Complete response');
      });

      it('should complete with metrics', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().startPendingResponse(id);
        store.getState().appendPendingResponse(id, 'Response');

        const metrics = { totalTime: 1000, totalTokens: 50 };
        store.getState().completePendingResponse(id, metrics);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages[0]?.metrics?.responseTime).toBe(1000);
        expect(workflow?.metrics).toEqual(metrics);
      });

      it('should include reasoning in message', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().startPendingResponse(id);
        store.getState().appendPendingResponse(id, 'Response');
        store.getState().appendPendingReasoning(id, 'Reasoning');

        store.getState().completePendingResponse(id);

        expect(store.getState().workflows.get(id)?.messages[0]?.reasoning).toBe('Reasoning');
      });
    });
  });

  describe('abort controller management', () => {
    it('setAbortController should set controller', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      const controller = new AbortController();

      store.getState().setAbortController(id, controller);

      expect(store.getState().getAbortController(id)).toBe(controller);
    });

    it('setAbortController with undefined should remove controller', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      const controller = new AbortController();
      store.getState().setAbortController(id, controller);

      store.getState().setAbortController(id, undefined);

      expect(store.getState().getAbortController(id)).toBeUndefined();
    });

    it('getAbortController should return undefined for non-existent', () => {
      const store = createWorkflowStore();

      expect(store.getState().getAbortController('non-existent')).toBeUndefined();
    });
  });

  describe('history management', () => {
    describe('clearWorkflowHistory', () => {
      it('should clear workflow history', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().addUserMessage(id, 'Test');
        store.getState().addAssistantMessage(id, 'Response');

        store.getState().clearWorkflowHistory(id);

        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages).toHaveLength(0);
        expect(workflow?.status).toBe('pending');
        expect(workflow?.pendingResponse).toBeUndefined();
      });

      it('should abort controller when clearing', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        const mockController = { abort: vi.fn() } as unknown as AbortController;
        store.getState().setAbortController(id, mockController);

        store.getState().clearWorkflowHistory(id);

        expect(mockController.abort).toHaveBeenCalled();
      });
    });

    describe('clearAllWorkflowHistory', () => {
      it('should clear all workflow histories', () => {
        const store = createWorkflowStore();
        const id1 = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        const id2 = store.getState().createWorkflow('anthropic:claude-3', 'key-2');
        store.getState().addUserMessage(id1, 'Test 1');
        store.getState().addUserMessage(id2, 'Test 2');

        store.getState().clearAllWorkflowHistory();

        expect(store.getState().workflows.get(id1)?.messages).toHaveLength(0);
        expect(store.getState().workflows.get(id2)?.messages).toHaveLength(0);
      });
    });

    describe('removeLastAssistantMessage', () => {
      it('should remove last assistant message', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().addUserMessage(id, 'User message');
        store.getState().addAssistantMessage(id, 'Assistant message');

        const userContent = store.getState().removeLastAssistantMessage(id);

        expect(userContent).toBe('User message');
        const workflow = store.getState().workflows.get(id);
        expect(workflow?.messages).toHaveLength(1);
        expect(workflow?.messages[0]?.role).toBe('user');
      });

      it('should return undefined if no assistant message', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().addUserMessage(id, 'User message');

        const result = store.getState().removeLastAssistantMessage(id);

        expect(result).toBeUndefined();
      });

      it('should return undefined for non-existent workflow', () => {
        const store = createWorkflowStore();

        const result = store.getState().removeLastAssistantMessage('non-existent');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('bulk operations', () => {
    describe('getWorkflow', () => {
      it('should return workflow by id', () => {
        const store = createWorkflowStore();
        const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

        const workflow = store.getState().getWorkflow(id);

        expect(workflow?.id).toBe(id);
      });

      it('should return undefined for non-existent', () => {
        const store = createWorkflowStore();

        const workflow = store.getState().getWorkflow('non-existent');

        expect(workflow).toBeUndefined();
      });
    });

    describe('getAllWorkflows', () => {
      it('should return all workflows', () => {
        const store = createWorkflowStore();
        store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().createWorkflow('anthropic:claude-3', 'key-2');

        const workflows = store.getState().getAllWorkflows();

        expect(workflows).toHaveLength(2);
      });
    });

    describe('getSyncedWorkflows', () => {
      it('should return only synced workflows', () => {
        const store = createWorkflowStore();
        store.getState().createWorkflow('openai:gpt-4', 'key-1', true);
        store.getState().createWorkflow('anthropic:claude-3', 'key-2', false);

        const synced = store.getState().getSyncedWorkflows();

        expect(synced).toHaveLength(1);
        expect(synced[0]?.synced).toBe(true);
      });
    });
  });

  describe('conversation management', () => {
    describe('setConversationId / getConversationId', () => {
      it('should set and get conversation id', () => {
        const store = createWorkflowStore();

        store.getState().setConversationId('conv-123');

        expect(store.getState().getConversationId()).toBe('conv-123');
      });

      it('should accept null', () => {
        const store = createWorkflowStore({ conversationId: 'conv-123' });

        store.getState().setConversationId(null);

        expect(store.getState().getConversationId()).toBeNull();
      });
    });

    describe('loadConversationHistory', () => {
      it('should load conversation history', () => {
        const store = createWorkflowStore();

        const data: LoadedConversation = {
          conversation: {
            id: 'conv-1',
            title: 'Test Conversation',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              createdAt: '2024-01-01T00:00:00Z',
              responses: [
                {
                  id: 'resp-1',
                  modelName: 'gpt-4',
                  providerName: 'openai',
                  responseContent: 'Hi there!',
                  displayPosition: 0,
                },
              ],
            },
          ],
        };

        const modelKeyMap = new Map([
          ['openai:gpt-4', { modelId: 'openai:gpt-4', keyId: 'key-1' }],
        ]);

        store.getState().loadConversationHistory(data, modelKeyMap);

        expect(store.getState().conversationId).toBe('conv-1');
        expect(store.getState().workflows.size).toBe(1);
        expect(store.getState().workflowOrder).toHaveLength(1);
      });

      it('should create workflows for each model', () => {
        const store = createWorkflowStore();

        const data: LoadedConversation = {
          conversation: {
            id: 'conv-1',
            title: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              createdAt: '2024-01-01T00:00:00Z',
              responses: [
                {
                  id: 'resp-1',
                  modelName: 'gpt-4',
                  providerName: 'openai',
                  responseContent: 'Response 1',
                  displayPosition: 0,
                },
                {
                  id: 'resp-2',
                  modelName: 'claude-3',
                  providerName: 'anthropic',
                  responseContent: 'Response 2',
                  displayPosition: 1,
                },
              ],
            },
          ],
        };

        const modelKeyMap = new Map([
          ['openai:gpt-4', { modelId: 'openai:gpt-4', keyId: 'key-1' }],
          ['anthropic:claude-3', { modelId: 'anthropic:claude-3', keyId: 'key-2' }],
        ]);

        store.getState().loadConversationHistory(data, modelKeyMap);

        expect(store.getState().workflows.size).toBe(2);
      });

      it('should set message id mapping', () => {
        const store = createWorkflowStore();

        const data: LoadedConversation = {
          conversation: {
            id: 'conv-1',
            title: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          messages: [
            {
              id: 'db-msg-1',
              role: 'user',
              content: 'Hello',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        };

        const modelKeyMap = new Map([
          ['openai:gpt-4', { modelId: 'openai:gpt-4', keyId: 'key-1' }],
        ]);

        store.getState().loadConversationHistory(data, modelKeyMap);

        expect(store.getState().messageIdMap.has('db-msg-1')).toBe(true);
      });
    });

    describe('resetConversation', () => {
      it('should reset all conversation state', () => {
        const store = createWorkflowStore();
        store.getState().createWorkflow('openai:gpt-4', 'key-1');
        store.getState().setConversationId('conv-1');
        store.getState().setGlobalPrompt('Test');

        store.getState().resetConversation();

        const state = store.getState();
        expect(state.workflows.size).toBe(0);
        expect(state.workflowOrder).toEqual([]);
        expect(state.globalPrompt).toBe('');
        expect(state.conversationId).toBeNull();
        expect(state.messageIdMap.size).toBe(0);
        expect(state.newConversation).toBeNull();
        expect(state.isCreatingConversation).toBe(false);
      });
    });

    describe('setMessageIdMapping / getDbMessageId', () => {
      it('should set and get message id mapping', () => {
        const store = createWorkflowStore();

        store.getState().setMessageIdMapping('db-1', 'wf-1');

        expect(store.getState().getDbMessageId('wf-1')).toBe('db-1');
      });

      it('should return undefined for non-existent mapping', () => {
        const store = createWorkflowStore();

        expect(store.getState().getDbMessageId('non-existent')).toBeUndefined();
      });
    });
  });

  describe('new conversation notification', () => {
    describe('setNewConversation', () => {
      it('should set new conversation info', () => {
        const store = createWorkflowStore();

        store.getState().setNewConversation({
          id: 'conv-1',
          title: 'New Conversation',
          updatedAt: '2024-01-01T00:00:00Z',
        });

        expect(store.getState().newConversation?.id).toBe('conv-1');
        expect(store.getState().isCreatingConversation).toBe(true);
      });
    });

    describe('clearNewConversation', () => {
      it('should clear new conversation', () => {
        const store = createWorkflowStore();
        store.getState().setNewConversation({
          id: 'conv-1',
          title: 'New',
          updatedAt: '2024-01-01T00:00:00Z',
        });

        store.getState().clearNewConversation();

        expect(store.getState().newConversation).toBeNull();
      });
    });
  });

  describe('setIsCreatingConversation', () => {
    it('should set creating flag', () => {
      const store = createWorkflowStore();

      store.getState().setIsCreatingConversation(true);

      expect(store.getState().isCreatingConversation).toBe(true);
    });
  });

  describe('setWorkflowStatus', () => {
    it('should set workflow status', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setWorkflowStatus(id, 'running');

      expect(store.getState().workflows.get(id)?.status).toBe('running');
    });

    it('should set error when status is failed', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      store.getState().setWorkflowStatus(id, 'failed', 'Error message');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.status).toBe('failed');
      expect(workflow?.error).toBe('Error message');
    });

    it('should clear error when status is not failed', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      store.getState().setWorkflowStatus(id, 'failed', 'Error');

      store.getState().setWorkflowStatus(id, 'completed');

      expect(store.getState().workflows.get(id)?.error).toBeUndefined();
    });

    it('should preserve pendingResponse when status is failed to allow error display', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      store.getState().startPendingResponse(id);
      store.getState().appendPendingResponse(id, 'Partial content');

      // Verify pendingResponse exists before setting failed status
      expect(store.getState().workflows.get(id)?.pendingResponse).toBeDefined();
      expect(store.getState().workflows.get(id)?.pendingResponse?.content).toBe('Partial content');

      store.getState().setWorkflowStatus(id, 'failed', 'Rate limit exceeded');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.status).toBe('failed');
      expect(workflow?.error).toBe('Rate limit exceeded');
      // pendingResponse should be preserved so UI can show error message
      expect(workflow?.pendingResponse).toBeDefined();
      expect(workflow?.pendingResponse?.content).toBe('Partial content');
    });

    it('should clear pendingResponse when status is cancelled', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      store.getState().startPendingResponse(id);
      store.getState().appendPendingResponse(id, 'Partial content');

      store.getState().setWorkflowStatus(id, 'cancelled');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.status).toBe('cancelled');
      expect(workflow?.pendingResponse).toBeUndefined();
    });

    it('should preserve pendingResponse when status is running', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');
      store.getState().startPendingResponse(id);
      store.getState().appendPendingResponse(id, 'Streaming content');

      store.getState().setWorkflowStatus(id, 'running');

      const workflow = store.getState().workflows.get(id);
      expect(workflow?.status).toBe('running');
      expect(workflow?.pendingResponse).toBeDefined();
      expect(workflow?.pendingResponse?.content).toBe('Streaming content');
    });
  });

  describe('selectors', () => {
    it('workflows selector should return workflows map', () => {
      const store = createWorkflowStore();
      store.getState().createWorkflow('openai:gpt-4', 'key-1');

      expect(workflowSelectors.workflows(store.getState()).size).toBe(1);
    });

    it('workflowOrder selector should return order array', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      expect(workflowSelectors.workflowOrder(store.getState())).toContain(id);
    });

    it('globalPrompt selector should return globalPrompt', () => {
      const store = createWorkflowStore({ globalPrompt: 'Test' });

      expect(workflowSelectors.globalPrompt(store.getState())).toBe('Test');
    });

    it('workflowCount selector should return count', () => {
      const store = createWorkflowStore();
      store.getState().createWorkflow('openai:gpt-4', 'key-1');
      store.getState().createWorkflow('anthropic:claude-3', 'key-2');

      expect(workflowSelectors.workflowCount(store.getState())).toBe(2);
    });

    it('isAnyRunning selector should detect running workflows', () => {
      const store = createWorkflowStore();
      const id = store.getState().createWorkflow('openai:gpt-4', 'key-1');

      expect(workflowSelectors.isAnyRunning(store.getState())).toBe(false);

      store.getState().setWorkflowStatus(id, 'running');

      expect(workflowSelectors.isAnyRunning(store.getState())).toBe(true);
    });

    it('allWorkflows selector should return array of workflows', () => {
      const store = createWorkflowStore();
      store.getState().createWorkflow('openai:gpt-4', 'key-1');

      expect(workflowSelectors.allWorkflows(store.getState())).toHaveLength(1);
    });

    it('syncedWorkflows selector should return only synced', () => {
      const store = createWorkflowStore();
      store.getState().createWorkflow('openai:gpt-4', 'key-1', true);
      store.getState().createWorkflow('anthropic:claude-3', 'key-2', false);

      expect(workflowSelectors.syncedWorkflows(store.getState())).toHaveLength(1);
    });

    it('conversationId selector should return conversationId', () => {
      const store = createWorkflowStore({ conversationId: 'conv-1' });

      expect(workflowSelectors.conversationId(store.getState())).toBe('conv-1');
    });

    it('hasConversation selector should return true when conversationId exists', () => {
      const store = createWorkflowStore({ conversationId: 'conv-1' });

      expect(workflowSelectors.hasConversation(store.getState())).toBe(true);
    });

    it('hasConversation selector should return false when conversationId is null', () => {
      const store = createWorkflowStore();

      expect(workflowSelectors.hasConversation(store.getState())).toBe(false);
    });

    it('newConversation selector should return newConversation', () => {
      const store = createWorkflowStore();
      const info = { id: 'conv-1', title: 'Test', updatedAt: '2024-01-01' };
      store.getState().setNewConversation(info);

      expect(workflowSelectors.newConversation(store.getState())).toEqual(info);
    });

    it('isCreatingConversation selector should return flag', () => {
      const store = createWorkflowStore();
      store.getState().setIsCreatingConversation(true);

      expect(workflowSelectors.isCreatingConversation(store.getState())).toBe(true);
    });
  });
});
