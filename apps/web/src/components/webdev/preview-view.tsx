'use client';

import * as React from 'react';
import { useWebDevStoreShallow } from '@/stores/webdev-store';

interface PreviewViewProps {
  iframeRefs: React.RefObject<Map<string, HTMLIFrameElement>>;
}

export function PreviewView({ iframeRefs }: PreviewViewProps) {
  const { sandboxes, activeWorkflowId } = useWebDevStoreShallow((s) => ({
    sandboxes: s.sandboxes,
    activeWorkflowId: s.activeWorkflowId,
  }));

  const [mountedTabs, setMountedTabs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (activeWorkflowId) {
      setMountedTabs((prev) => {
        if (prev.has(activeWorkflowId)) return prev;
        const next = new Set(prev);
        next.add(activeWorkflowId);
        return next;
      });
    }
  }, [activeWorkflowId]);

  const entries = React.useMemo(() => Array.from(sandboxes.entries()), [sandboxes]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {entries.map(([workflowId, sandbox]) => {
        const isActive = workflowId === activeWorkflowId;
        const isMounted = mountedTabs.has(workflowId);
        const previewUrl = sandbox.previewUrl;

        if (!isMounted || !previewUrl) {
          return isActive && !previewUrl ? (
            <div key={workflowId} className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {sandbox.status === 'idle' ? 'Waiting for generation...' : 'Building preview...'}
              </p>
            </div>
          ) : null;
        }

        return (
          <iframe
            key={workflowId}
            ref={(el) => {
              if (el) {
                iframeRefs.current.set(workflowId, el);
              } else {
                iframeRefs.current.delete(workflowId);
              }
            }}
            src={previewUrl}
            title={`Preview - ${workflowId}`}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
            style={{
              visibility: isActive ? 'visible' : 'hidden',
            }}
          />
        );
      })}
    </div>
  );
}
