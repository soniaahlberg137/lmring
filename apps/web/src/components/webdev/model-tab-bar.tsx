'use client';

import { cn, ScrollArea, ScrollBar } from '@lmring/ui';
import * as React from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { OPTION_COLORS } from '@/constants/webdev';
import { useWebDevStore, useWebDevStoreShallow } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
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
  const workflows = useWorkflowStore((s) => s.workflows);

  const entries = React.useMemo(() => Array.from(sandboxes.entries()), [sandboxes]);

  if (entries.length <= 1) return null;

  return (
    <div className="shrink-0 border-b border-[#E8E4DF] bg-[#F5F0EB]">
      <ScrollArea className="w-full">
        <div className="flex h-12 items-stretch">
          {entries.map(([workflowId, sandbox], index) => {
            const color = OPTION_COLORS[index];
            const isActive = activeWorkflowId === workflowId;
            const workflow = workflows.get(workflowId);
            const modelId = workflow?.modelId ?? '';
            const providerId = modelId.split(':')[0] ?? '';
            const modelName = modelId.split(':').pop() ?? '';

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
                <ProviderIcon providerId={providerId} size={18} type="avatar" />

                <span className="max-w-[120px] truncate">{modelName}</span>

                <StatusDot status={sandbox.status} />

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
