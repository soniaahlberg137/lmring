'use client';

import { ScrollArea } from '@lmring/ui';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeBlockContent } from '@/components/ai-elements/code-block';
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree';
import { useWebDevStoreShallow } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import type { IterationSnapshot } from '@/types/webdev';
import { BuildingOverlay } from './building-overlay';
import { CodeView } from './code-view';
import { ErrorState } from './error-state';
import { ModelTabBar } from './model-tab-bar';
import { PreviewView } from './preview-view';
import { StreamingCodeView } from './streaming-code-view';
import { Toolbar } from './toolbar';
import {
  buildFileTree,
  type FileTreeNode,
  getAllFolderPaths,
  getLanguageFromPath,
} from './utils/file-tree-utils';

const FILE_TREE_WIDTH = 240;

type ViewMode = 'preview' | 'code';

interface RightPanelProps {
  className?: string;
}

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

/** Read-only code view for past iteration snapshots */
function SnapshotCodeView({
  snapshot,
  activeWorkflowId,
}: {
  snapshot: IterationSnapshot;
  activeWorkflowId: string | null;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  const sandboxSnapshot = activeWorkflowId ? snapshot.sandboxes.get(activeWorkflowId) : undefined;
  const files = sandboxSnapshot?.files ?? {};
  const hasFiles = Object.keys(files).length > 0;
  const [activeFile, setActiveFile] = React.useState<string | null>(
    () => Object.keys(files)[0] ?? null,
  );

  // Reset activeFile when workflow changes
  React.useEffect(() => {
    setActiveFile(Object.keys(files)[0] ?? null);
  }, [files]);

  const fileContent = activeFile ? (files[activeFile] ?? '') : '';
  const filePaths = React.useMemo(() => Object.keys(files), [files]);
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

export function RightPanel({ className }: RightPanelProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('preview');
  const { sandboxes, activeWorkflowId, phase, iterations, activeIterationVersion } =
    useWebDevStoreShallow((s) => ({
      sandboxes: s.sandboxes,
      activeWorkflowId: s.activeWorkflowId,
      phase: s.phase,
      iterations: s.iterations,
      activeIterationVersion: s.activeIterationVersion,
    }));

  const activeWorkflowStatus = useWorkflowStore((s) => {
    if (!activeWorkflowId) return undefined;
    return s.workflows.get(activeWorkflowId)?.status;
  });
  const activeWorkflowError = useWorkflowStore((s) => {
    if (!activeWorkflowId) return undefined;
    return s.workflows.get(activeWorkflowId)?.error;
  });

  // Check if viewing a past iteration
  const pastIteration = React.useMemo(() => {
    if (activeIterationVersion === 0) return undefined;
    return iterations.find((it) => it.version === activeIterationVersion);
  }, [activeIterationVersion, iterations]);

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
        {pastIteration ? (
          <SnapshotCodeView snapshot={pastIteration} activeWorkflowId={activeWorkflowId} />
        ) : phase === 'error' ? (
          <ErrorState message={activeWorkflowError ?? activeSandbox?.error ?? undefined} />
        ) : phase === 'generating' && activeWorkflowStatus === 'failed' ? (
          <ErrorState message={activeWorkflowError ?? undefined} />
        ) : phase === 'generating' ? (
          <StreamingCodeView />
        ) : viewMode === 'preview' ? (
          <PreviewView iframeRefs={iframeRefs} />
        ) : (
          <CodeView />
        )}

        {isBuilding && !pastIteration && <BuildingOverlay />}
      </div>
    </div>
  );
}
