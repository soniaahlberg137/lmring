'use client';

import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lmring/ui';
import { Code, Copy, Download, ExternalLink, Eye, Globe, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
  const [isSpinning, setIsSpinning] = React.useState(false);
  const { t } = useTranslation();

  const handleRefresh = React.useCallback(() => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 400);
  }, [onRefresh]);

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

  const submittedPrompt = useWebDevStore((s) => s.submittedPrompt);

  const handleDownload = React.useCallback(async () => {
    const files = activeSandbox?.files;
    if (!files || Object.keys(files).length === 0) {
      toast.error(t('WebDev.no_files_to_download'));
      return;
    }

    try {
      const { downloadFilesAsZip, promptToFilename } = await import('@/utils/download-zip');
      const filename = `${promptToFilename(submittedPrompt)}.zip`;
      downloadFilesAsZip(files, filename);
    } catch {
      toast.error(t('WebDev.download_failed'));
    }
  }, [activeSandbox?.files, submittedPrompt, t]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[#E8E4DF] bg-[#F5F0EB] px-3">
        <div className="flex items-center rounded-lg bg-[#F5F0EB] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'preview'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#71717A] hover:text-[#1A1A1A]',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('WebDev.tab_preview_label')}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('code')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'code'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#71717A] hover:text-[#1A1A1A]',
            )}
          >
            <Code className="h-3.5 w-3.5" />
            {t('WebDev.tab_code_label')}
          </button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!isReady}
              className="webdev-toolbar-btn disabled:pointer-events-none disabled:opacity-40"
              aria-label={t('WebDev.refresh_preview_label')}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4 transition-transform duration-400',
                  isSpinning && 'rotate-[360deg]',
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('WebDev.refresh_preview_label')}
          </TooltipContent>
        </Tooltip>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[#F5F0EB] px-3 py-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[#71717A]" />
          <span className="truncate text-xs text-[#71717A]">{previewUrl ?? 'localhost:3000'}</span>
        </div>

        <ToolbarButton
          icon={Copy}
          label={t('WebDev.copy_url')}
          onClick={handleCopyUrl}
          disabled={!previewUrl}
        />
        <ToolbarButton
          icon={ExternalLink}
          label={t('WebDev.open_new_tab')}
          onClick={handleOpenExternal}
          disabled={!previewUrl}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!isReady}
              className="flex items-center gap-1.5 rounded-md bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              {t('WebDev.download_label')}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('WebDev.download_code_label')}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
