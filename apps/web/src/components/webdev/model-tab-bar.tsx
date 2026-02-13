'use client';

import { cn, ScrollArea, ScrollBar } from '@lmring/ui';
import * as React from 'react';
import { OPTION_COLORS } from '@/constants/webdev';
import { useWebDevStore, useWebDevStoreShallow } from '@/stores/webdev-store';
import type { SandboxStatus } from '@/types/webdev';

function StatusDot({ status }: { status: SandboxStatus }) {
  const isActive = status === 'creating' || status === 'installing' || status === 'starting';
  const isReady = status === 'ready';
  const isError = status === 'error' || status === 'expired' || status === 'stopped';

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        isActive && 'bg-blue-500 webdev-status-pulse',
        isReady && 'bg-green-500',
        isError && 'bg-red-500',
        !isActive && !isReady && !isError && 'bg-zinc-400',
      )}
    />
  );
}

export function ModelTabBar() {
  const { activeWorkflowId } = useWebDevStoreShallow((s) => ({
    activeWorkflowId: s.activeWorkflowId,
  }));
  const setActiveWorkflowId = useWebDevStore((s) => s.setActiveWorkflowId);
  const sandboxes = useWebDevStore((s) => s.sandboxes);

  const entries = React.useMemo(() => Array.from(sandboxes.entries()), [sandboxes]);

  if (entries.length <= 1) return null;

  return (
    <div className="shrink-0 border-b border-[#E8E4DF] bg-[#F5F0EB]">
      <ScrollArea className="w-full">
        <div className="flex h-12 items-stretch">
          {entries.map(([workflowId, sandbox], index) => {
            const color = OPTION_COLORS[index];
            const isActive = activeWorkflowId === workflowId;

            return (
              <button
                key={workflowId}
                type="button"
                onClick={() => setActiveWorkflowId(workflowId)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'font-semibold text-[#1A1A1A]'
                    : 'font-medium text-[#71717A] hover:text-[#1A1A1A]',
                )}
              >
                {/* Badge letter */}
                {color && (
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: color.bg }}
                  >
                    {color.key}
                  </span>
                )}

                {/* Model name */}
                <span className="max-w-[120px] truncate">Option {color?.key ?? index + 1}</span>

                {/* Status dot */}
                <StatusDot status={sandbox.status} />

                {/* Active indicator - bottom border matching badge color */}
                {isActive && color && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color.bg }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
