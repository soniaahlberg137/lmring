'use client';

import {
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  ScrollBar,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lmring/ui';
import { Code, Copy, ExternalLink, Eye, Globe, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeBlockContent } from '@/components/ai-elements/code-block';
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree';
import { ProviderIcon } from '@/components/arena/provider-icon';
import { OPTION_COLORS } from '@/constants/webdev';
import { type SharedSandboxState, useSharedWebDevSandbox } from '@/hooks/use-shared-webdev-sandbox';
import { AppConfig } from '@/utils/AppConfig';
import {
  buildFileTree,
  type FileTreeNode,
  getAllFolderPaths,
  getLanguageFromPath,
} from './utils/file-tree-utils';

const PANEL_MIN_SIZE_LEFT = 25;
const PANEL_DEFAULT_SIZE_LEFT = 31;
const PANEL_DEFAULT_SIZE_RIGHT = 69;
const FILE_TREE_WIDTH = 240;

type ViewMode = 'preview' | 'code';

export interface SharedWebDevViewProps {
  shareToken: string;
  session: { id: string; prompt: string; status: string };
  responses: Array<{
    id: string;
    modelId: string;
    files: Record<string, string> | null;
    status: string;
    displayPosition: number;
    snapshotId: string | null;
    snapshotExpiresAt: string | null;
    content: string | null;
  }>;
  iterations: Array<{
    id: string;
    version: number;
    prompt: string;
    createdAt: string;
  }>;
  user: { name: string | null; avatarUrl: string | null };
  conversationTitle: string;
}

export function SharedWebDevView({
  shareToken,
  session,
  responses,
  iterations,
}: SharedWebDevViewProps) {
  const { t } = useTranslation();
  const sortedResponses = React.useMemo(
    () => [...responses].sort((a, b) => a.displayPosition - b.displayPosition),
    [responses],
  );

  const sandboxResponses = React.useMemo(
    () => sortedResponses.map((r) => ({ id: r.id, snapshotId: r.snapshotId })),
    [sortedResponses],
  );

  const { sandboxes, createSandbox } = useSharedWebDevSandbox(shareToken, sandboxResponses);

  const [activeResponseId, setActiveResponseId] = React.useState<string | null>(
    () => sortedResponses[0]?.id ?? null,
  );
  const [viewMode, setViewMode] = React.useState<ViewMode>('preview');

  const activeResponse = sortedResponses.find((r) => r.id === activeResponseId);
  const activeSandbox = activeResponseId ? sandboxes.get(activeResponseId) : undefined;

  return (
    <div className="flex h-full flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={PANEL_DEFAULT_SIZE_LEFT}
          minSize={PANEL_MIN_SIZE_LEFT}
          className="flex flex-col"
        >
          <SharedLeftPanel
            session={session}
            iterations={iterations}
            responses={sortedResponses}
            sandboxes={sandboxes}
            activeResponseId={activeResponseId}
            onSelectResponse={setActiveResponseId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={PANEL_DEFAULT_SIZE_RIGHT} className="flex flex-col">
          <SharedRightPanel
            responses={sortedResponses}
            sandboxes={sandboxes}
            activeResponseId={activeResponseId}
            activeSandbox={activeSandbox}
            activeResponse={activeResponse}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSelectResponse={setActiveResponseId}
            onRebuild={createSandbox}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          {t('SharedWebDev.read_only_notice')}{' '}
          <Link href="/" className="text-primary hover:underline">
            {AppConfig.name}
          </Link>
        </p>
      </div>
    </div>
  );
}

// --- Left Panel ---

function SharedLeftPanel({
  session,
  iterations,
  responses,
  sandboxes,
  activeResponseId,
  onSelectResponse,
}: {
  session: SharedWebDevViewProps['session'];
  iterations: SharedWebDevViewProps['iterations'];
  responses: SharedWebDevViewProps['responses'];
  sandboxes: Map<string, SharedSandboxState>;
  activeResponseId: string | null;
  onSelectResponse: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col bg-[var(--webdev-card-bg)]">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Iteration timeline */}
          <div className="rounded-xl bg-[var(--webdev-bg)] p-3">
            <p className="mb-2 px-1 text-xs font-medium text-[var(--webdev-text-muted)]">
              {t('WebDev.iteration_history')}
            </p>
            <div className="flex flex-col gap-1">
              {iterations.length > 0 ? (
                iterations.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start gap-2.5 rounded-lg bg-[var(--webdev-card-bg)] px-3 py-2 ring-1 ring-[var(--webdev-border)]"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                      {t('SharedWebDev.iteration_label', { version: it.version })}
                    </span>
                    <span className="min-w-0 flex-1 text-xs leading-snug text-[var(--webdev-text)] line-clamp-2">
                      {it.prompt}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-[var(--webdev-card-bg)] px-3 py-2 ring-1 ring-[var(--webdev-border)]">
                  <span className="text-xs leading-snug text-[var(--webdev-text)] line-clamp-3">
                    {session.prompt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model cards */}
          {responses.map((response) => {
            const sandbox = sandboxes.get(response.id);
            const providerId = response.modelId.split(':')[0] ?? '';
            const modelName = response.modelId.split(':').pop() ?? response.modelId;
            const isActive = activeResponseId === response.id;
            const status = sandbox?.status ?? 'idle';

            return (
              <button
                key={response.id}
                type="button"
                onClick={() => onSelectResponse(response.id)}
                className={cn(
                  'w-full rounded-xl border border-[var(--webdev-border)] bg-[var(--webdev-card-bg)] p-4 text-left transition-colors',
                  isActive && 'ring-2 ring-[var(--webdev-border)]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ProviderIcon providerId={providerId} size={20} type="avatar" />
                  <span className="text-sm font-semibold text-[var(--webdev-text)] truncate">
                    {modelName}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    <SharedStatusIndicator status={status} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- Status Indicator ---

function SharedStatusIndicator({ status }: { status: SharedSandboxState['status'] }) {
  const { t } = useTranslation();
  const isActive = status === 'creating' || status === 'installing' || status === 'starting';
  const isReady = status === 'ready';
  const isError = status === 'error';

  const label = (() => {
    switch (status) {
      case 'creating':
        return t('WebDev.status_creating_sandbox');
      case 'installing':
        return t('WebDev.status_installing_deps');
      case 'starting':
        return t('WebDev.status_starting_server');
      case 'ready':
        return t('WebDev.status_ready');
      case 'error':
        return t('WebDev.status_error');
      default:
        return t('WebDev.status_waiting');
    }
  })();

  const colorClass = isReady
    ? 'text-green-700 dark:text-green-500'
    : isActive
      ? 'text-blue-700 dark:text-blue-500'
      : isError
        ? 'text-red-700 dark:text-red-500'
        : 'text-zinc-500 dark:text-zinc-400';

  return (
    <>
      {isActive && <Loader2 className={cn('h-3.5 w-3.5 animate-spin', colorClass)} />}
      <span className={cn('text-xs font-medium', colorClass)}>{label}</span>
    </>
  );
}

// --- Right Panel ---

function SharedRightPanel({
  responses,
  sandboxes,
  activeResponseId,
  activeSandbox,
  activeResponse,
  viewMode,
  onViewModeChange,
  onSelectResponse,
  onRebuild,
}: {
  responses: SharedWebDevViewProps['responses'];
  sandboxes: Map<string, SharedSandboxState>;
  activeResponseId: string | null;
  activeSandbox: SharedSandboxState | undefined;
  activeResponse: SharedWebDevViewProps['responses'][number] | undefined;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectResponse: (id: string) => void;
  onRebuild: (responseId: string) => Promise<void>;
}) {
  const iframeRefs = React.useRef<Map<string, HTMLIFrameElement>>(new Map());

  const handleRefresh = React.useCallback(() => {
    if (!activeResponseId) return;
    const iframe = iframeRefs.current.get(activeResponseId);
    if (iframe?.src) {
      const url = iframe.src;
      iframe.src = url;
    }
  }, [activeResponseId]);

  const isBuilding =
    activeSandbox?.status === 'creating' ||
    activeSandbox?.status === 'installing' ||
    activeSandbox?.status === 'starting';

  return (
    <div className="flex h-full flex-col bg-[var(--webdev-bg)]">
      {responses.length > 1 && (
        <SharedModelTabBar
          responses={responses}
          sandboxes={sandboxes}
          activeResponseId={activeResponseId}
          onSelect={onSelectResponse}
        />
      )}

      <SharedToolbar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onRefresh={handleRefresh}
        previewUrl={activeSandbox?.previewUrl ?? null}
        isReady={activeSandbox?.status === 'ready'}
      />

      <div className="relative flex-1 overflow-hidden">
        {activeSandbox?.status === 'error' ? (
          <SharedErrorState
            error={activeSandbox.error}
            onRebuild={activeResponseId ? () => onRebuild(activeResponseId) : undefined}
          />
        ) : viewMode === 'preview' ? (
          <SharedPreviewView
            responses={responses}
            sandboxes={sandboxes}
            activeResponseId={activeResponseId}
            iframeRefs={iframeRefs}
          />
        ) : (
          <SharedCodeView files={activeResponse?.files ?? null} />
        )}

        {isBuilding && <SharedBuildingOverlay status={activeSandbox?.status ?? 'creating'} />}
      </div>
    </div>
  );
}

// --- Model Tab Bar ---

function SharedModelTabBar({
  responses,
  sandboxes,
  activeResponseId,
  onSelect,
}: {
  responses: SharedWebDevViewProps['responses'];
  sandboxes: Map<string, SharedSandboxState>;
  activeResponseId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-[var(--webdev-border)] bg-[var(--webdev-bg)]">
      <ScrollArea className="w-full">
        <div className="flex h-12 items-stretch">
          {responses.map((response, index) => {
            const color = OPTION_COLORS[index];
            const isActive = activeResponseId === response.id;
            const providerId = response.modelId.split(':')[0] ?? '';
            const modelName = response.modelId.split(':').pop() ?? '';
            const sandbox = sandboxes.get(response.id);
            const status = sandbox?.status ?? 'idle';

            return (
              <button
                key={response.id}
                type="button"
                onClick={() => onSelect(response.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'font-semibold text-[var(--webdev-text)]'
                    : 'font-medium text-[var(--webdev-text-muted)] hover:text-[var(--webdev-text)]',
                )}
              >
                <ProviderIcon providerId={providerId} size={18} type="avatar" />
                <span className="max-w-[120px] truncate">{modelName}</span>
                <StatusDot status={status} />
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

function StatusDot({ status }: { status: SharedSandboxState['status'] }) {
  const isActive = status === 'creating' || status === 'installing' || status === 'starting';
  const isReady = status === 'ready';
  const isError = status === 'error';

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

// --- Toolbar ---

function SharedToolbar({
  viewMode,
  onViewModeChange,
  onRefresh,
  previewUrl,
  isReady,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  previewUrl: string | null;
  isReady: boolean;
}) {
  const { t } = useTranslation();
  const [isSpinning, setIsSpinning] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 400);
  }, [onRefresh]);

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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--webdev-border)] bg-[var(--webdev-bg)] px-3">
        <div className="flex items-center rounded-lg bg-[var(--webdev-bg)] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'preview'
                ? 'bg-[var(--webdev-card-bg)] text-[var(--webdev-text)] shadow-sm'
                : 'text-[var(--webdev-text-muted)] hover:text-[var(--webdev-text)]',
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
                ? 'bg-[var(--webdev-card-bg)] text-[var(--webdev-text)] shadow-sm'
                : 'text-[var(--webdev-text-muted)] hover:text-[var(--webdev-text)]',
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

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[var(--webdev-bg)] px-3 py-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--webdev-text-muted)]" />
          <span className="truncate text-xs text-[var(--webdev-text-muted)]">
            {previewUrl ?? 'localhost:3000'}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopyUrl}
              disabled={!previewUrl}
              className="webdev-toolbar-btn disabled:pointer-events-none disabled:opacity-40"
              aria-label={t('WebDev.copy_url')}
            >
              <Copy className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('WebDev.copy_url')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleOpenExternal}
              disabled={!previewUrl}
              className="webdev-toolbar-btn disabled:pointer-events-none disabled:opacity-40"
              aria-label={t('WebDev.open_new_tab')}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('WebDev.open_new_tab')}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// --- Preview View ---

function SharedPreviewView({
  responses,
  sandboxes,
  activeResponseId,
  iframeRefs,
}: {
  responses: SharedWebDevViewProps['responses'];
  sandboxes: Map<string, SharedSandboxState>;
  activeResponseId: string | null;
  iframeRefs: React.RefObject<Map<string, HTMLIFrameElement>>;
}) {
  const { t } = useTranslation();
  const [mountedTabs, setMountedTabs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (activeResponseId) {
      setMountedTabs((prev) => {
        if (prev.has(activeResponseId)) return prev;
        const next = new Set(prev);
        next.add(activeResponseId);
        return next;
      });
    }
  }, [activeResponseId]);

  if (responses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('WebDev.no_preview')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {responses.map((response) => {
        const isActive = response.id === activeResponseId;
        const isMounted = mountedTabs.has(response.id);
        const sandbox = sandboxes.get(response.id);
        const previewUrl = sandbox?.previewUrl;

        if (!isMounted || !previewUrl) {
          return isActive && !previewUrl ? (
            <div key={response.id} className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {sandbox?.status === 'idle'
                  ? t('WebDev.waiting_generation')
                  : t('WebDev.building_preview')}
              </p>
            </div>
          ) : null;
        }

        return (
          <iframe
            key={response.id}
            ref={(el) => {
              if (el) {
                iframeRefs.current.set(response.id, el);
              } else {
                iframeRefs.current.delete(response.id);
              }
            }}
            src={previewUrl}
            title={`Preview - ${response.modelId}`}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
            style={{ visibility: isActive ? 'visible' : 'hidden' }}
          />
        );
      })}
    </div>
  );
}

// --- Code View ---

function renderTreeNodes(nodes: FileTreeNode[]): React.ReactNode {
  return nodes.map((node) =>
    node.type === 'folder' ? (
      <FileTreeFolder key={node.path} path={node.path} name={node.name}>
        {node.children && renderTreeNodes(node.children)}
      </FileTreeFolder>
    ) : (
      <FileTreeFile key={node.path} path={node.path} name={node.name} />
    ),
  );
}

function SharedCodeView({ files }: { files: Record<string, string> | null }) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  const safeFiles = files ?? {};
  const filePaths = React.useMemo(() => Object.keys(safeFiles), [safeFiles]);
  const hasFiles = filePaths.length > 0;
  const [activeFile, setActiveFile] = React.useState<string | null>(() => filePaths[0] ?? null);

  // Reset active file when files change
  React.useEffect(() => {
    setActiveFile(filePaths[0] ?? null);
  }, [filePaths]);

  const fileContent = activeFile ? (safeFiles[activeFile] ?? '') : '';
  const treeNodes = React.useMemo(() => buildFileTree(filePaths), [filePaths]);
  const defaultExpanded = React.useMemo(() => getAllFolderPaths(filePaths), [filePaths]);
  const language = getLanguageFromPath(activeFile ?? '');

  if (!hasFiles) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: 'var(--webdev-editor-bg)' }}
      >
        <p className="text-sm" style={{ color: 'var(--webdev-editor-text-muted)' }}>
          {t('WebDev.no_files_yet')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="webdev-editor-scope flex h-full"
      style={{ backgroundColor: 'var(--webdev-editor-bg)' }}
    >
      <div
        className="shrink-0 border-r"
        style={{
          backgroundColor: 'var(--webdev-editor-sidebar)',
          borderColor: 'var(--webdev-editor-border)',
          width: FILE_TREE_WIDTH,
        }}
      >
        <ScrollArea className="h-full">
          <FileTree
            selectedPath={activeFile ?? undefined}
            onSelect={setActiveFile}
            defaultExpanded={defaultExpanded}
            className="rounded-none border-0 bg-transparent text-xs"
          >
            {renderTreeNodes(treeNodes)}
          </FileTree>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-auto">
        {activeFile ? (
          <ScrollArea className="h-full w-full">
            <CodeBlockContent
              code={fileContent}
              language={language}
              showLineNumbers
              theme={codeTheme}
            />
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--webdev-editor-text-muted)' }}>
              {t('WebDev.select_file')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Error State ---

function SharedErrorState({ error, onRebuild }: { error: string | null; onRebuild?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-sm text-destructive">{error ?? t('SharedWebDev.sandbox_error')}</p>
      {onRebuild && (
        <button
          type="button"
          onClick={onRebuild}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('SharedWebDev.rebuild_preview')}
        </button>
      )}
    </div>
  );
}

// --- Building Overlay ---

function SharedBuildingOverlay({ status }: { status: SharedSandboxState['status'] }) {
  const { t } = useTranslation();

  const label = (() => {
    switch (status) {
      case 'creating':
        return t('WebDev.status_creating_sandbox');
      case 'installing':
        return t('WebDev.status_installing_deps');
      case 'starting':
        return t('WebDev.status_starting_server');
      default:
        return t('SharedWebDev.sandbox_loading');
    }
  })();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-lg border bg-card px-6 py-4 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
