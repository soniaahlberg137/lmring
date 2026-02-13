'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@lmring/ui';
import * as React from 'react';
import { useWebDevCleanup } from '@/hooks/use-webdev-cleanup';
import { useWebDevGeneration } from '@/hooks/use-webdev-generation';
import { useWebDevSandbox } from '@/hooks/use-webdev-sandbox';
import { useWebDevStore, useWebDevStoreShallow, WebDevStoreProvider } from '@/stores/webdev-store';
import { WorkflowStoreProvider } from '@/stores/workflow-store';
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
  const { resetProcessed } = useWebDevSandbox({ getResponseId });

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

            // Reset processed sandboxes for a fresh generation round
            resetProcessed();

            // Wire generation: create workflows, seed system prompt, start AI streaming
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
  }, [setConversationId, setPhase, setPrompt, setSessionId, resetProcessed, startGeneration]);

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
