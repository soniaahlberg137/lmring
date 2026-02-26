'use client';

import * as React from 'react';
import { useWebDevStoreShallow } from '@/stores/webdev-store';
import { BuildingOverlay } from './building-overlay';
import { CodeView } from './code-view';
import { ModelTabBar } from './model-tab-bar';
import { PreviewView } from './preview-view';
import { StreamingCodeView } from './streaming-code-view';
import { Toolbar } from './toolbar';

type ViewMode = 'preview' | 'code';

interface RightPanelProps {
  className?: string;
}

export function RightPanel({ className }: RightPanelProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('preview');
  const { sandboxes, activeWorkflowId, phase } = useWebDevStoreShallow((s) => ({
    sandboxes: s.sandboxes,
    activeWorkflowId: s.activeWorkflowId,
    phase: s.phase,
  }));

  const activeSandbox = activeWorkflowId ? sandboxes.get(activeWorkflowId) : undefined;
  const isBuilding =
    activeSandbox?.status === 'creating' ||
    activeSandbox?.status === 'installing' ||
    activeSandbox?.status === 'starting';

  const iframeRefs = React.useRef<Map<string, HTMLIFrameElement>>(new Map());

  const handleRefresh = React.useCallback(() => {
    if (!activeWorkflowId) return;
    const iframe = iframeRefs.current.get(activeWorkflowId);
    if (iframe?.src) {
      const url = iframe.src;
      iframe.src = url;
    }
  }, [activeWorkflowId]);

  return (
    <div className={`flex h-full flex-col bg-[var(--webdev-bg)] ${className ?? ''}`}>
      {sandboxes.size > 1 && <ModelTabBar />}

      <Toolbar viewMode={viewMode} onViewModeChange={setViewMode} onRefresh={handleRefresh} />

      <div className="relative flex-1 overflow-hidden">
        {phase === 'generating' ? (
          <StreamingCodeView />
        ) : viewMode === 'preview' ? (
          <PreviewView iframeRefs={iframeRefs} />
        ) : (
          <CodeView />
        )}

        {isBuilding && <BuildingOverlay />}
      </div>
    </div>
  );
}
