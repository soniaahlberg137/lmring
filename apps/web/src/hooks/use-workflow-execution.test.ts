import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as workflowApiModule from '@/libs/workflow-api';
import * as workflowStoreModule from '@/stores/workflow-store';
import type { ArenaWorkflow, WorkflowStatus } from '@/types/workflow';
import { useWorkflowExecution } from './use-workflow-execution';

describe('useWorkflowExecution', () => {
  let useWorkflowStoreSpy: ReturnType<typeof vi.spyOn>;
  let streamWorkflowSpy: ReturnType<typeof vi.spyOn>;
  let _buildWorkflowStreamRequestSpy: ReturnType<typeof vi.spyOn>;

  const mockWorkflow: ArenaWorkflow = {
    id: 'workflow-1',
    modelId: 'openai:gpt-4',
    keyId: 'key-1',
    synced: true,
    status: 'idle' as WorkflowStatus,
    messages: [],
    pendingResponse: undefined,
    config: {
      temperature: 0.7,
      maxTokens: 4096,
    },
    customPrompt: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStoreFunctions = {
    addUserMessage: vi.fn(),
    startPendingResponse: vi.fn(),
    appendPendingResponse: vi.fn(),
    appendPendingReasoning: vi.fn(),
    completePendingResponse: vi.fn(),
    setWorkflowStatus: vi.fn(),
    setAbortController: vi.fn(),
    getAbortController: vi.fn(),
    getWorkflow: vi.fn(),
    getSyncedWorkflows: vi.fn(),
    getGlobalPrompt: vi.fn().mockReturnValue('Test prompt'),
    clearWorkflowHistory: vi.fn(),
    removeLastAssistantMessage: vi.fn(),
    getConversationId: vi.fn().mockReturnValue(null),
    setConversationId: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    useWorkflowStoreSpy = vi.spyOn(workflowStoreModule, 'useWorkflowStore');
    useWorkflowStoreSpy.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        ...mockStoreFunctions,
      };
      return selector(state);
    });

    _buildWorkflowStreamRequestSpy = vi
      .spyOn(workflowApiModule, 'buildWorkflowStreamRequest')
      .mockReturnValue({
        workflowId: 'workflow-1',
        modelId: 'gpt-4',
        keyId: 'key-1',
        messages: [],
        config: { temperature: 0.7, maxTokens: 4096 },
      });

    streamWorkflowSpy = vi.spyOn(workflowApiModule, 'streamWorkflow');

    Object.values(mockStoreFunctions).forEach((fn) => {
      if (typeof fn === 'function') {
        fn.mockClear?.();
      }
    });

    mockStoreFunctions.getWorkflow.mockReturnValue(mockWorkflow);
    mockStoreFunctions.getSyncedWorkflows.mockReturnValue([mockWorkflow]);
    mockStoreFunctions.getAbortController.mockReturnValue(undefined);
    mockStoreFunctions.getConversationId.mockReturnValue(null);
    mockStoreFunctions.getGlobalPrompt.mockReturnValue('Test prompt');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startWorkflow', () => {
    it('validates workflow exists', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue(undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('non-existent', 'prompt');
      });

      expect(errorSpy).toHaveBeenCalledWith('Workflow not found:', 'non-existent');
      errorSpy.mockRestore();
    });

    it('validates workflow is not already running', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue({ ...mockWorkflow, status: 'running' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'prompt');
      });

      expect(warnSpy).toHaveBeenCalledWith('Workflow already running:', 'workflow-1');
      warnSpy.mockRestore();
    });

    it('validates prompt is not empty', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', '  ');
      });

      expect(warnSpy).toHaveBeenCalledWith('Empty prompt provided');
      warnSpy.mockRestore();
    });

    it('executes workflow stream successfully', async () => {
      async function* mockStream() {
        yield { type: 'chunk' as const, workflowId: 'workflow-1', chunk: 'Hello' };
        yield { type: 'complete' as const, workflowId: 'workflow-1', metrics: { totalTokens: 10 } };
      }

      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'Test prompt');
      });

      expect(mockStoreFunctions.addUserMessage).toHaveBeenCalledWith(
        'workflow-1',
        'Test prompt',
        undefined,
      );
      expect(mockStoreFunctions.startPendingResponse).toHaveBeenCalledWith('workflow-1');
      expect(mockStoreFunctions.appendPendingResponse).toHaveBeenCalledWith('workflow-1', 'Hello');
      expect(mockStoreFunctions.completePendingResponse).toHaveBeenCalled();
    });
  });

  describe('continueWorkflow', () => {
    it('validates workflow exists', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue(undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueWorkflow('non-existent', 'follow-up');
      });

      expect(errorSpy).toHaveBeenCalledWith('Workflow not found:', 'non-existent');
      errorSpy.mockRestore();
    });

    it('validates workflow is not running', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue({ ...mockWorkflow, status: 'running' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueWorkflow('workflow-1', 'follow-up');
      });

      expect(warnSpy).toHaveBeenCalledWith('Workflow already running:', 'workflow-1');
      warnSpy.mockRestore();
    });

    it('validates follow-up prompt is not empty', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueWorkflow('workflow-1', '');
      });

      expect(warnSpy).toHaveBeenCalledWith('Empty follow-up prompt provided');
      warnSpy.mockRestore();
    });
  });

  describe('cancelWorkflow', () => {
    it('aborts controller and sets cancelled status', () => {
      const mockController = { abort: vi.fn() };
      mockStoreFunctions.getAbortController.mockReturnValue(mockController);

      const { result } = renderHook(() => useWorkflowExecution());

      act(() => {
        result.current.cancelWorkflow('workflow-1');
      });

      expect(mockController.abort).toHaveBeenCalled();
      expect(mockStoreFunctions.setAbortController).toHaveBeenCalledWith('workflow-1', undefined);
      expect(mockStoreFunctions.setWorkflowStatus).toHaveBeenCalledWith('workflow-1', 'cancelled');
    });

    it('does nothing when no abort controller exists', () => {
      mockStoreFunctions.getAbortController.mockReturnValue(undefined);

      const { result } = renderHook(() => useWorkflowExecution());

      act(() => {
        result.current.cancelWorkflow('workflow-1');
      });

      expect(mockStoreFunctions.setWorkflowStatus).not.toHaveBeenCalled();
    });
  });

  describe('retryWorkflow', () => {
    it('validates workflow exists', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue(undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.retryWorkflow('non-existent');
      });

      expect(errorSpy).toHaveBeenCalledWith('Workflow not found:', 'non-existent');
      errorSpy.mockRestore();
    });

    it('only retries failed workflows', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue({ ...mockWorkflow, status: 'idle' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.retryWorkflow('workflow-1');
      });

      expect(warnSpy).toHaveBeenCalledWith('Can only retry failed or cancelled workflows');
      warnSpy.mockRestore();
    });

    it('only retries cancelled workflows', async () => {
      const failedWorkflow = {
        ...mockWorkflow,
        status: 'cancelled' as WorkflowStatus,
        messages: [{ id: 'msg-1', role: 'user' as const, content: 'Test', createdAt: new Date() }],
      };
      mockStoreFunctions.getWorkflow.mockReturnValue(failedWorkflow);

      async function* mockStream() {
        yield { type: 'complete' as const, workflowId: 'workflow-1' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.retryWorkflow('workflow-1');
      });

      expect(mockStoreFunctions.clearWorkflowHistory).toHaveBeenCalledWith('workflow-1');
    });

    it('warns when no user message to retry', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue({
        ...mockWorkflow,
        status: 'failed' as WorkflowStatus,
        messages: [],
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.retryWorkflow('workflow-1');
      });

      expect(warnSpy).toHaveBeenCalledWith('No user message to retry');
      warnSpy.mockRestore();
    });
  });

  describe('regenerateLastResponse', () => {
    it('validates workflow exists', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue(undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.regenerateLastResponse('non-existent');
      });

      expect(errorSpy).toHaveBeenCalledWith('Workflow not found:', 'non-existent');
      errorSpy.mockRestore();
    });

    it('validates workflow is not running', async () => {
      mockStoreFunctions.getWorkflow.mockReturnValue({ ...mockWorkflow, status: 'running' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.regenerateLastResponse('workflow-1');
      });

      expect(warnSpy).toHaveBeenCalledWith('Workflow is currently running:', 'workflow-1');
      warnSpy.mockRestore();
    });

    it('warns when no user message found', async () => {
      mockStoreFunctions.removeLastAssistantMessage.mockReturnValue(undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.regenerateLastResponse('workflow-1');
      });

      expect(warnSpy).toHaveBeenCalledWith('No user message found to regenerate response');
      warnSpy.mockRestore();
    });

    it('removes last assistant message and re-executes', async () => {
      mockStoreFunctions.removeLastAssistantMessage.mockReturnValue('Previous user content');

      async function* mockStream() {
        yield { type: 'complete' as const, workflowId: 'workflow-1' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.regenerateLastResponse('workflow-1');
      });

      expect(mockStoreFunctions.removeLastAssistantMessage).toHaveBeenCalledWith('workflow-1');
      expect(mockStoreFunctions.addUserMessage).toHaveBeenCalled();
    });
  });

  describe('startAllSyncedWorkflows', () => {
    it('validates global prompt is not empty', async () => {
      mockStoreFunctions.getGlobalPrompt.mockReturnValue('  ');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startAllSyncedWorkflows();
      });

      expect(warnSpy).toHaveBeenCalledWith('Empty global prompt');
      warnSpy.mockRestore();
    });

    it('warns when no runnable synced workflows', async () => {
      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([
        { ...mockWorkflow, status: 'running' },
      ]);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startAllSyncedWorkflows();
      });

      expect(warnSpy).toHaveBeenCalledWith('No runnable synced workflows');
      warnSpy.mockRestore();
    });

    it('executes all synced workflows in parallel', async () => {
      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([
        mockWorkflow,
        { ...mockWorkflow, id: 'workflow-2' },
      ]);

      async function* mockStream() {
        yield { type: 'complete' as const, workflowId: 'workflow-1' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startAllSyncedWorkflows();
      });

      expect(mockStoreFunctions.addUserMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('continueAllSyncedWorkflows', () => {
    it('validates follow-up prompt is not empty', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueAllSyncedWorkflows('');
      });

      expect(warnSpy).toHaveBeenCalledWith('Empty follow-up prompt');
      warnSpy.mockRestore();
    });

    it('warns when no runnable synced workflows', async () => {
      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([
        { ...mockWorkflow, status: 'running' },
      ]);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueAllSyncedWorkflows('follow-up');
      });

      expect(warnSpy).toHaveBeenCalledWith('No runnable synced workflows');
      warnSpy.mockRestore();
    });

    it('continues all synced workflows in parallel', async () => {
      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([
        mockWorkflow,
        { ...mockWorkflow, id: 'workflow-2' },
      ]);

      async function* mockStream() {
        yield { type: 'complete' as const, workflowId: 'workflow-1' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.continueAllSyncedWorkflows('follow-up');
      });

      expect(mockStoreFunctions.addUserMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelAllWorkflows', () => {
    it('cancels all running workflows', () => {
      const mockController1 = { abort: vi.fn() };
      const mockController2 = { abort: vi.fn() };

      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([
        { ...mockWorkflow, id: 'workflow-1', status: 'running' },
        { ...mockWorkflow, id: 'workflow-2', status: 'running' },
        { ...mockWorkflow, id: 'workflow-3', status: 'idle' },
      ]);

      let callCount = 0;
      mockStoreFunctions.getAbortController.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockController1;
        return mockController2;
      });

      const { result } = renderHook(() => useWorkflowExecution());

      act(() => {
        result.current.cancelAllWorkflows();
      });

      expect(mockController1.abort).toHaveBeenCalled();
      expect(mockController2.abort).toHaveBeenCalled();
      expect(mockStoreFunctions.setWorkflowStatus).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no running workflows', () => {
      mockStoreFunctions.getSyncedWorkflows.mockReturnValue([{ ...mockWorkflow, status: 'idle' }]);

      const { result } = renderHook(() => useWorkflowExecution());

      act(() => {
        result.current.cancelAllWorkflows();
      });

      expect(mockStoreFunctions.setWorkflowStatus).not.toHaveBeenCalled();
    });
  });

  describe('stream event handling', () => {
    it('handles reasoning events', async () => {
      async function* mockStream() {
        yield { type: 'reasoning' as const, workflowId: 'workflow-1', reasoning: 'Thinking...' };
        yield { type: 'complete' as const, workflowId: 'workflow-1' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'Test');
      });

      expect(mockStoreFunctions.appendPendingReasoning).toHaveBeenCalledWith(
        'workflow-1',
        'Thinking...',
      );
    });

    it('handles error events', async () => {
      async function* mockStream() {
        yield { type: 'error' as const, workflowId: 'workflow-1', error: 'API error' };
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'Test');
      });

      expect(mockStoreFunctions.setWorkflowStatus).toHaveBeenCalledWith(
        'workflow-1',
        'failed',
        'API error',
      );
    });

    it('handles AbortError correctly', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      async function* mockStream() {
        yield { type: 'chunk' as const, workflowId: 'workflow-1', chunk: '' };
        throw abortError;
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'Test');
      });

      expect(mockStoreFunctions.setWorkflowStatus).toHaveBeenCalledWith('workflow-1', 'cancelled');
    });

    it('handles unknown errors', async () => {
      async function* mockStream() {
        yield { type: 'chunk' as const, workflowId: 'workflow-1', chunk: '' };
        throw new Error('Unknown error');
      }
      streamWorkflowSpy.mockReturnValue(mockStream());

      const { result } = renderHook(() => useWorkflowExecution());

      await act(async () => {
        await result.current.startWorkflow('workflow-1', 'Test');
      });

      expect(mockStoreFunctions.setWorkflowStatus).toHaveBeenCalledWith(
        'workflow-1',
        'failed',
        'Unknown error',
      );
    });
  });
});
