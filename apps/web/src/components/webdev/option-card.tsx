'use client';

import { cn } from '@lmring/ui';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { STATUS_COLORS } from '@/constants/webdev';
import { useWebDevStore } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import type { SandboxStatus } from '@/types/webdev';
import { ActivityLog, type ActivityLogItem } from './activity-log';

function getStatusLabel(status: SandboxStatus): string {
  switch (status) {
    case 'idle':
      return 'Waiting';
    case 'creating':
      return 'Creating sandbox...';
    case 'installing':
      return 'Installing deps...';
    case 'starting':
      return 'Starting server...';
    case 'ready':
      return 'Ready';
    case 'error':
      return 'Error';
    case 'expired':
      return 'Expired';
    case 'stopped':
      return 'Stopped';
  }
}

function getStatusColorClass(status: SandboxStatus): string {
  switch (status) {
    case 'ready':
      return STATUS_COLORS.complete.tw;
    case 'creating':
    case 'installing':
    case 'starting':
      return STATUS_COLORS.building.tw;
    case 'error':
    case 'expired':
    case 'stopped':
      return STATUS_COLORS.error.tw;
    default:
      return STATUS_COLORS.idle.tw;
  }
}

function isActiveStatus(status: SandboxStatus): boolean {
  return status === 'creating' || status === 'installing' || status === 'starting';
}

function buildActivityItems(
  status: SandboxStatus,
  files: Record<string, string>,
  error: string | null,
): ActivityLogItem[] {
  const items: ActivityLogItem[] = [];

  const fileCount = Object.keys(files).length;
  if (fileCount > 0) {
    items.push({
      id: 'files',
      icon: 'file-plus',
      text: `${fileCount} file${fileCount > 1 ? 's' : ''} generated`,
    });
  }

  if (
    status === 'creating' ||
    status === 'installing' ||
    status === 'starting' ||
    status === 'ready'
  ) {
    items.push({ id: 'sandbox', icon: 'folder', text: 'Sandbox created' });
  }

  if (status === 'installing' || status === 'starting' || status === 'ready') {
    items.push({ id: 'install', icon: 'pencil', text: 'Dependencies installed' });
  }

  if (status === 'ready') {
    items.push({ id: 'ready', icon: 'circle-check', text: 'Preview ready' });
  }

  if (status === 'error' && error) {
    items.push({ id: 'error', icon: 'circle-x', text: error });
  }

  return items;
}

interface OptionCardProps {
  workflowId: string;
  index: number;
  modelName: string;
  isActive: boolean;
  showVote: boolean;
  onClick: () => void;
}

export const OptionCard = React.memo(function OptionCard({
  workflowId,
  index: _index,
  modelName,
  isActive,
  showVote: _showVote,
  onClick,
}: OptionCardProps) {
  const sandbox = useWebDevStore((s) => s.sandboxes.get(workflowId));
  const workflow = useWorkflowStore((s) => s.workflows.get(workflowId));
  const modelId = workflow?.modelId ?? '';
  const providerId = modelId.split(':')[0] ?? '';
  const status = sandbox?.status ?? 'idle';
  const files = sandbox?.files ?? {};
  const error = sandbox?.error ?? null;

  const activityItems = React.useMemo(
    () => buildActivityItems(status, files, error),
    [status, files, error],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-[#E8E4DF] bg-white p-4 text-left transition-colors',
        isActive && 'ring-2 ring-[#E8E4DF]',
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <ProviderIcon providerId={providerId} size={20} type="avatar" />
        <span className="text-sm font-semibold text-[#1A1A1A] truncate">{modelName}</span>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          {isActiveStatus(status) && (
            <Loader2 className={cn('h-3.5 w-3.5 animate-spin', getStatusColorClass(status))} />
          )}
          <span className={cn('text-xs font-medium', getStatusColorClass(status))}>
            {getStatusLabel(status)}
          </span>
        </span>
      </div>

      <ActivityLog items={activityItems} />
    </button>
  );
});
