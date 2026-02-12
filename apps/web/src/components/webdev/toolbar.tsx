'use client';

import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lmring/ui';
import { Code, Copy, Download, ExternalLink, Eye, Globe, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { useWebDevStore } from '@/stores/webdev-store';

type ViewMode = 'preview' | 'code';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="webdev-toolbar-btn disabled:pointer-events-none disabled:opacity-40"
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({ viewMode, onViewModeChange, onRefresh }: ToolbarProps) {
  const activeSandbox = useWebDevStore((s) => {
    if (!s.activeWorkflowId) return undefined;
    return s.sandboxes.get(s.activeWorkflowId);
  });

  const previewUrl = activeSandbox?.previewUrl ?? null;
  const isReady = activeSandbox?.status === 'ready';

  const handleCopyUrl = React.useCallback(() => {
    if (previewUrl) {
      void navigator.clipboard.writeText(previewUrl);
    }
  }, [previewUrl]);

  const handleOpenExternal = React.useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [previewUrl]);

  const handleDownload = React.useCallback(() => {
    // Placeholder for download functionality
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[var(--webdev-border)] bg-background px-3">
        {/* View toggle */}
        <div className="flex items-center rounded-lg bg-[var(--webdev-input-bg)] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('code')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'code'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Code className="h-3.5 w-3.5" />
            Code
          </button>
        </div>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-[var(--webdev-border)]" />

        {/* Refresh */}
        <ToolbarButton
          icon={RefreshCw}
          label="Refresh preview"
          onClick={onRefresh}
          disabled={!isReady}
        />

        {/* URL bar */}
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[var(--webdev-input-bg)] px-3 py-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs text-muted-foreground">
            {previewUrl ?? 'No preview available'}
          </span>
        </div>

        {/* Action buttons */}
        <ToolbarButton
          icon={Copy}
          label="Copy URL"
          onClick={handleCopyUrl}
          disabled={!previewUrl}
        />
        <ToolbarButton
          icon={ExternalLink}
          label="Open in new tab"
          onClick={handleOpenExternal}
          disabled={!previewUrl}
        />
        <ToolbarButton
          icon={Download}
          label="Download code"
          onClick={handleDownload}
          disabled={!isReady}
        />
      </div>
    </TooltipProvider>
  );
}
