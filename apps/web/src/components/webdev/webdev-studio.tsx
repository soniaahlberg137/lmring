'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@lmring/ui';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { conversationsKeys } from '@/hooks/use-conversations-query';
import { useWebDevCleanup } from '@/hooks/use-webdev-cleanup';
import { useWebDevGeneration } from '@/hooks/use-webdev-generation';
import { useWebDevSandbox } from '@/hooks/use-webdev-sandbox';
import { useWebDevStore, useWebDevStoreShallow, WebDevStoreProvider } from '@/stores/webdev-store';
import { useWorkflowStore, WorkflowStoreProvider } from '@/stores/workflow-store';
import { ConfigModal } from './config-modal';
import { LeftPanel } from './left-panel';
import { RightPanel } from './right-panel';
import { WelcomeState } from './welcome-state';

interface WebDevStudioProps {
  initialSessionId?: string;
}

const PANEL_MIN_SIZE_LEFT = 25;
const PANEL_DEFAULT_SIZE_LEFT = 31;
const PANEL_DEFAULT_SIZE_RIGHT = 69;
const BREAKPOINT_LG = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINT_LG}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

function WebDevStudioInner({ initialSessionId }: WebDevStudioProps) {
  const isDesktop = useIsDesktop();

  // Sandbox lifecycle management: beforeunload, heartbeat, unmount cleanup
  useWebDevCleanup();

  // Generation orchestration: creates workflows, seeds system prompt, starts AI streaming
  const { startGeneration, handleFollowUp, getResponseId } = useWebDevGeneration();

  // Sandbox auto-creation: watches workflow completions, triggers sandbox build via SSE
  const { resetProcessed, rebuildSandboxFromFiles } = useWebDevSandbox({ getResponseId });

  const { phase, featureConfig, sessionId } = useWebDevStoreShallow((s) => ({
    phase: s.phase,
    featureConfig: s.featureConfig,
    sessionId: s.sessionId,
  }));

  const checkConfig = useWebDevStore((s) => s.checkConfig);
  const setSessionId = useWebDevStore((s) => s.setSessionId);
  const setConversationId = useWebDevStore((s) => s.setConversationId);
  const setPhase = useWebDevStore((s) => s.setPhase);
  const setPrompt = useWebDevStore((s) => s.setPrompt);
  const initSandbox = useWebDevStore((s) => s.initSandbox);
  const setSandboxFiles = useWebDevStore((s) => s.setSandboxFiles);
  const setSandboxReady = useWebDevStore((s) => s.setSandboxReady);
  const updateSandboxStatus = useWebDevStore((s) => s.updateSandboxStatus);
  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);
  const setWorkflowStatus = useWorkflowStore((s) => s.setWorkflowStatus);
  const queryClient = useQueryClient();

  // Check feature config on mount
  React.useEffect(() => {
    void checkConfig();
  }, [checkConfig]);

  // Handle initialSessionId — load existing session if provided
  React.useEffect(() => {
    if (initialSessionId && initialSessionId !== sessionId) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId, sessionId, setSessionId]);

  // Load existing session from API
  const sessionLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (!initialSessionId || sessionLoadedRef.current) return;
    // Skip if init data exists (handled by creation flow)
    const hasInitData = sessionStorage.getItem('webdev_init');
    if (hasInitData) return;

    sessionLoadedRef.current = true;

    const loadSession = async () => {
      try {
        const res = await fetch(`/api/webdev/session/${initialSessionId}`);
        if (!res.ok) {
          setPhase('error');
          return;
        }
        const data = (await res.json()) as {
          session: {
            id: string;
            conversationId: string | null;
            prompt: string;
            status: string;
          };
          responses: Array<{
            id: string;
            modelId: string;
            keyId: string;
            status: string;
            files: Record<string, string> | null;
            sandboxId: string | null;
            previewUrl: string | null;
            expiresAt: string | null;
          }>;
        };

        // Restore session-level state
        setSessionId(data.session.id);
        if (data.session.conversationId) {
          setConversationId(data.session.conversationId);
        }
        setPrompt(data.session.prompt);

        // Restore per-response state
        let firstWorkflowId: string | null = null;
        const sandboxesToRebuild: Array<{
          workflowId: string;
          files: Record<string, string>;
          responseId: string;
        }> = [];

        for (const response of data.responses) {
          const workflowId = createWorkflow(response.modelId, response.keyId);
          setWorkflowStatus(workflowId, 'completed');

          if (!firstWorkflowId) firstWorkflowId = workflowId;

          initSandbox(workflowId);

          if (response.files) {
            setSandboxFiles(workflowId, response.files);
          }

          // Restore sandbox preview or queue rebuild for expired VMs
          if (response.sandboxId && response.previewUrl) {
            const isExpired =
              response.expiresAt != null && new Date(response.expiresAt) <= new Date();

            if (isExpired && response.files) {
              updateSandboxStatus(workflowId, 'creating');
              sandboxesToRebuild.push({
                workflowId,
                files: response.files,
                responseId: response.id,
              });
            } else if (isExpired) {
              updateSandboxStatus(workflowId, 'stopped');
            } else {
              setSandboxReady(
                workflowId,
                response.sandboxId,
                response.previewUrl,
                response.expiresAt,
              );
            }
          } else if (response.files && response.status !== 'error') {
            updateSandboxStatus(workflowId, 'creating');
            sandboxesToRebuild.push({
              workflowId,
              files: response.files,
              responseId: response.id,
            });
          } else if (response.status === 'error') {
            updateSandboxStatus(workflowId, 'error');
          } else {
            updateSandboxStatus(workflowId, 'stopped');
          }
        }

        if (firstWorkflowId) {
          setActiveWorkflowId(firstWorkflowId);
        }

        if (sandboxesToRebuild.length > 0) {
          setPhase('building');
          for (const entry of sandboxesToRebuild) {
            rebuildSandboxFromFiles(
              entry.workflowId,
              entry.files,
              data.session.id,
              entry.responseId,
            );
          }
        } else {
          setPhase('ready');
        }
      } catch {
        setPhase('error');
      }
    };
    void loadSession();
  }, [
    initialSessionId,
    setSessionId,
    setConversationId,
    setPrompt,
    setPhase,
    createWorkflow,
    setWorkflowStatus,
    initSandbox,
    setSandboxFiles,
    setSandboxReady,
    updateSandboxStatus,
    setActiveWorkflowId,
    rebuildSandboxFromFiles,
  ]);

  // Read init data from sessionStorage (passed from arena page)
  const initDataReadRef = React.useRef(false);
  React.useEffect(() => {
    if (initDataReadRef.current) return;
    initDataReadRef.current = true;

    const raw = sessionStorage.getItem('webdev_init');
    if (!raw) return;
    sessionStorage.removeItem('webdev_init');

    try {
      const data = JSON.parse(raw) as {
        prompt?: string;
        models?: Array<{ modelId: string; keyId: string }>;
        conversationId?: string;
      };

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.prompt && data.models?.length) {
        const { prompt, models } = data;
        setPhase('generating');
        setPrompt(prompt);

        const createSession = async () => {
          try {
            const res = await fetch('/api/webdev/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                models,
                ...(data.conversationId ? { conversationId: data.conversationId } : {}),
              }),
            });
            if (!res.ok) {
              setPhase('error');
              return;
            }
            const result = (await res.json()) as {
              sessionId: string;
              responses: Array<{
                id: string;
                modelId: string;
                displayPosition: number;
              }>;
            };
            setSessionId(result.sessionId);

            window.history.replaceState(null, '', `/webdev/${result.sessionId}`);
            window.dispatchEvent(new Event('url-replaced'));

            void queryClient.invalidateQueries({ queryKey: conversationsKeys.all });

            resetProcessed();

            await startGeneration({
              prompt,
              models,
              sessionResponses: result.responses,
            });
          } catch {
            setPhase('error');
          }
        };
        void createSession();
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, [
    setConversationId,
    setPhase,
    setPrompt,
    setSessionId,
    resetProcessed,
    startGeneration,
    queryClient,
  ]);

  const [configModalOpen, setConfigModalOpen] = React.useState(false);

  // Show config modal when feature is disabled and config has loaded
  React.useEffect(() => {
    if (featureConfig && !featureConfig.enabled) {
      setConfigModalOpen(true);
    }
  }, [featureConfig]);

  const onFollowUp = React.useCallback(
    (prompt: string) => {
      resetProcessed();
      void handleFollowUp(prompt);
    },
    [handleFollowUp, resetProcessed],
  );

  const handleSelectPrompt = React.useCallback(
    (prompt: string) => {
      setPrompt(prompt);
    },
    [setPrompt],
  );

  const isIdle = phase === 'idle' && !sessionId;

  if (!isDesktop) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center bg-[var(--webdev-bg)]">
          <p className="text-sm text-muted-foreground">
            WebDev Preview — mobile layout coming soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={PANEL_DEFAULT_SIZE_LEFT}
          minSize={PANEL_MIN_SIZE_LEFT}
          className="flex flex-col"
        >
          <LeftPanel onFollowUp={onFollowUp} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={PANEL_DEFAULT_SIZE_RIGHT} className="flex flex-col">
          {isIdle ? (
            <div className="flex h-full items-center justify-center bg-[var(--webdev-bg)]">
              <WelcomeState onSelectPrompt={handleSelectPrompt} />
            </div>
          ) : (
            <RightPanel />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ConfigModal open={configModalOpen} onOpenChange={setConfigModalOpen} />
    </>
  );
}

export function WebDevStudio(props: WebDevStudioProps) {
  return (
    <WorkflowStoreProvider>
      <WebDevStoreProvider>
        <WebDevStudioInner {...props} />
      </WebDevStoreProvider>
    </WorkflowStoreProvider>
  );
}
