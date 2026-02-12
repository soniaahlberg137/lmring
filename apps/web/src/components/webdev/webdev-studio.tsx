'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@lmring/ui';
import * as React from 'react';
import { useWebDevCleanup } from '@/hooks/use-webdev-cleanup';
import { useWebDevStore, useWebDevStoreShallow, WebDevStoreProvider } from '@/stores/webdev-store';
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

  const { phase, featureConfig, sessionId } = useWebDevStoreShallow((s) => ({
    phase: s.phase,
    featureConfig: s.featureConfig,
    sessionId: s.sessionId,
  }));

  const checkConfig = useWebDevStore((s) => s.checkConfig);
  const setSessionId = useWebDevStore((s) => s.setSessionId);
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

  const [configModalOpen, setConfigModalOpen] = React.useState(false);

  // Show config modal when feature is disabled and config has loaded
  React.useEffect(() => {
    if (featureConfig && !featureConfig.enabled) {
      setConfigModalOpen(true);
    }
  }, [featureConfig]);

  const handleFollowUp = React.useCallback((prompt: string) => {
    // TODO: Wire to actual workflow execution in T16
    console.log('Follow-up prompt:', prompt);
  }, []);

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
          <LeftPanel onFollowUp={handleFollowUp} />
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
    <WebDevStoreProvider>
      <WebDevStudioInner {...props} />
    </WebDevStoreProvider>
  );
}
