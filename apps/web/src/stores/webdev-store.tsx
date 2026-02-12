'use client';

import { createContext, type ReactNode, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  DEFAULT_SANDBOX_STATE,
  DEFAULT_WEBDEV_STATE,
  type SandboxStatus,
  type WebDevConfig,
  type WebDevStore,
} from '@/types/webdev';

/**
 * Create the WebDev Store
 *
 * Layer 2 store: manages sandbox/preview state per model.
 * Layer 1 (WorkflowStore) handles AI generation, streaming, abort controllers.
 */
export const createWebDevStore = (initState: Partial<typeof DEFAULT_WEBDEV_STATE> = {}) => {
  return createStore<WebDevStore>()(
    devtools(
      (set, get) => ({
        ...DEFAULT_WEBDEV_STATE,
        ...initState,

        // --- Session management ---

        setSessionId: (id) => {
          set({ sessionId: id }, false, 'webdev/setSessionId');
        },

        setPhase: (phase) => {
          set({ phase }, false, 'webdev/setPhase');
        },

        resetSession: () => {
          const { sandboxes } = get();
          // Fire-and-forget cleanup of all sandboxes
          const destroyPromises: Promise<void>[] = [];
          for (const [, sandbox] of sandboxes) {
            if (sandbox.sandboxId) {
              destroyPromises.push(
                fetch(`/api/webdev/sandbox/${sandbox.sandboxId}`, { method: 'DELETE' }).then(
                  () => {},
                  () => {},
                ),
              );
            }
          }
          // Don't await — fire and forget
          if (destroyPromises.length > 0) {
            void Promise.allSettled(destroyPromises);
          }

          set(
            {
              ...DEFAULT_WEBDEV_STATE,
              featureConfig: get().featureConfig, // preserve config cache
            },
            false,
            'webdev/resetSession',
          );
        },

        // --- Sandbox management (per-model) ---

        initSandbox: (workflowId) => {
          set(
            (state) => {
              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, { ...DEFAULT_SANDBOX_STATE });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/initSandbox',
          );
        },

        updateSandboxStatus: (workflowId, status, error) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                status,
                error: error ?? (status === 'error' ? sandbox.error : null),
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/updateSandboxStatus',
          );
        },

        setSandboxReady: (workflowId, sandboxId, previewUrl, expiresAt) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                sandboxId,
                previewUrl,
                expiresAt,
                status: 'ready' as SandboxStatus,
                error: null,
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/setSandboxReady',
          );
        },

        setSandboxFiles: (workflowId, files) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const firstFile = Object.keys(files)[0] ?? null;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                files,
                activeFile: sandbox.activeFile ?? firstFile,
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/setSandboxFiles',
          );
        },

        appendSandboxFile: (workflowId, path, content) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                files: { ...sandbox.files, [path]: content },
                activeFile: sandbox.activeFile ?? path,
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/appendSandboxFile',
          );
        },

        setActiveFile: (workflowId, path) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                activeFile: path,
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/setActiveFile',
          );
        },

        appendTerminalOutput: (workflowId, line) => {
          set(
            (state) => {
              const sandbox = state.sandboxes.get(workflowId);
              if (!sandbox) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...sandbox,
                terminalOutput: [...sandbox.terminalOutput, line],
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/appendTerminalOutput',
          );
        },

        destroySandbox: async (workflowId) => {
          const sandbox = get().sandboxes.get(workflowId);
          if (!sandbox?.sandboxId) return;

          const sandboxId = sandbox.sandboxId;

          // Optimistically mark as stopped
          set(
            (state) => {
              const s = state.sandboxes.get(workflowId);
              if (!s) return state;

              const newSandboxes = new Map(state.sandboxes);
              newSandboxes.set(workflowId, {
                ...s,
                status: 'stopped' as SandboxStatus,
                sandboxId: null,
                previewUrl: null,
              });
              return { sandboxes: newSandboxes };
            },
            false,
            'webdev/destroySandbox',
          );

          try {
            await fetch(`/api/webdev/sandbox/${sandboxId}`, { method: 'DELETE' });
          } catch {
            // Best-effort cleanup — sandbox will auto-expire regardless
          }
        },

        destroyAllSandboxes: async () => {
          const { sandboxes } = get();
          const promises: Promise<void>[] = [];

          for (const [workflowId] of sandboxes) {
            promises.push(get().destroySandbox(workflowId));
          }

          await Promise.allSettled(promises);
        },

        // --- Active model tab ---

        setActiveWorkflowId: (id) => {
          set({ activeWorkflowId: id }, false, 'webdev/setActiveWorkflowId');
        },

        // --- Feature config ---

        setFeatureConfig: (config) => {
          set({ featureConfig: config }, false, 'webdev/setFeatureConfig');
        },

        checkConfig: async () => {
          try {
            const res = await fetch('/api/webdev/config');
            if (!res.ok) {
              set(
                {
                  featureConfig: {
                    enabled: false,
                    provider: 'disabled',
                    reason: 'VERCEL_SANDBOX_NOT_CONFIGURED',
                  },
                },
                false,
                'webdev/checkConfig/error',
              );
              return;
            }
            const config = (await res.json()) as WebDevConfig;
            set({ featureConfig: config }, false, 'webdev/checkConfig');
          } catch {
            set(
              {
                featureConfig: {
                  enabled: false,
                  provider: 'disabled',
                  reason: 'VERCEL_SANDBOX_NOT_CONFIGURED',
                },
              },
              false,
              'webdev/checkConfig/fetchError',
            );
          }
        },

        // --- Prompt ---

        setPrompt: (prompt) => {
          set({ prompt }, false, 'webdev/setPrompt');
        },

        // --- Selectors ---

        getSandbox: (workflowId) => {
          return get().sandboxes.get(workflowId);
        },

        getActiveSandbox: () => {
          const { activeWorkflowId, sandboxes } = get();
          if (!activeWorkflowId) return undefined;
          return sandboxes.get(activeWorkflowId);
        },

        isAnyBuildingOrReady: () => {
          const { sandboxes } = get();
          for (const [, s] of sandboxes) {
            if (
              s.status === 'creating' ||
              s.status === 'installing' ||
              s.status === 'starting' ||
              s.status === 'ready'
            ) {
              return true;
            }
          }
          return false;
        },
      }),
      { name: 'webdev-store', enabled: process.env.NODE_ENV === 'development' },
    ),
  );
};

type WebDevStoreApi = ReturnType<typeof createWebDevStore>;

const WebDevStoreContext = createContext<WebDevStoreApi | null>(null);

export function WebDevStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<WebDevStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createWebDevStore();
  }

  return (
    <WebDevStoreContext.Provider value={storeRef.current}>{children}</WebDevStoreContext.Provider>
  );
}

export function useWebDevStore<T>(selector: (state: WebDevStore) => T): T {
  const store = useContext(WebDevStoreContext);
  if (!store) {
    throw new Error('useWebDevStore must be used within WebDevStoreProvider');
  }
  return useStore(store, selector);
}

export function useWebDevStoreShallow<T>(selector: (state: WebDevStore) => T): T {
  const store = useContext(WebDevStoreContext);
  if (!store) {
    throw new Error('useWebDevStoreShallow must be used within WebDevStoreProvider');
  }
  return useStore(store, useShallow(selector));
}

/**
 * Pre-defined selectors for common use cases
 */
export const webdevSelectors = {
  phase: (state: WebDevStore) => state.phase,
  sessionId: (state: WebDevStore) => state.sessionId,
  prompt: (state: WebDevStore) => state.prompt,
  sandboxes: (state: WebDevStore) => state.sandboxes,
  activeWorkflowId: (state: WebDevStore) => state.activeWorkflowId,
  featureConfig: (state: WebDevStore) => state.featureConfig,
  isEnabled: (state: WebDevStore) => state.featureConfig?.enabled === true,

  activeSandbox: (state: WebDevStore) => {
    if (!state.activeWorkflowId) return undefined;
    return state.sandboxes.get(state.activeWorkflowId);
  },

  sandboxCount: (state: WebDevStore) => state.sandboxes.size,

  readySandboxCount: (state: WebDevStore) => {
    let count = 0;
    for (const [, s] of state.sandboxes) {
      if (s.status === 'ready') count++;
    }
    return count;
  },

  isAnyBuilding: (state: WebDevStore) => {
    for (const [, s] of state.sandboxes) {
      if (s.status === 'creating' || s.status === 'installing' || s.status === 'starting') {
        return true;
      }
    }
    return false;
  },

  // Composite selector for WebDev studio page
  webdevState: (state: WebDevStore) => ({
    phase: state.phase,
    sessionId: state.sessionId,
    prompt: state.prompt,
    sandboxes: state.sandboxes,
    activeWorkflowId: state.activeWorkflowId,
    featureConfig: state.featureConfig,
  }),

  // Composite selector for actions
  webdevActions: (state: WebDevStore) => ({
    setSessionId: state.setSessionId,
    setPhase: state.setPhase,
    resetSession: state.resetSession,
    initSandbox: state.initSandbox,
    updateSandboxStatus: state.updateSandboxStatus,
    setSandboxReady: state.setSandboxReady,
    setSandboxFiles: state.setSandboxFiles,
    appendSandboxFile: state.appendSandboxFile,
    setActiveFile: state.setActiveFile,
    appendTerminalOutput: state.appendTerminalOutput,
    destroySandbox: state.destroySandbox,
    destroyAllSandboxes: state.destroyAllSandboxes,
    setActiveWorkflowId: state.setActiveWorkflowId,
    setFeatureConfig: state.setFeatureConfig,
    checkConfig: state.checkConfig,
    setPrompt: state.setPrompt,
  }),
};
