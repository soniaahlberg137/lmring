'use client';

import { ScrollArea } from '@lmring/ui';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeBlockContent } from '@/components/ai-elements/code-block';
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree';
import { useWebDevStore } from '@/stores/webdev-store';
import {
  buildFileTree,
  type FileTreeNode,
  getAllFolderPaths,
  getLanguageFromPath,
} from './utils/file-tree-utils';

const FILE_TREE_WIDTH = 240;

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

export function CodeView() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const activeWorkflowId = useWebDevStore((s) => s.activeWorkflowId);
  const sandbox = useWebDevStore((s) => {
    if (!s.activeWorkflowId) return undefined;
    return s.sandboxes.get(s.activeWorkflowId);
  });
  const setActiveFile = useWebDevStore((s) => s.setActiveFile);

  const files = sandbox?.files ?? {};
  const activeFile = sandbox?.activeFile ?? null;
  const fileContent = activeFile ? (files[activeFile] ?? '') : '';
  const hasFiles = Object.keys(files).length > 0;

  const filePaths = React.useMemo(() => Object.keys(files), [files]);
  const treeNodes = React.useMemo(() => buildFileTree(filePaths), [filePaths]);
  const defaultExpanded = React.useMemo(() => getAllFolderPaths(filePaths), [filePaths]);

  const handleSelectFile = React.useCallback(
    (path: string) => {
      if (activeWorkflowId) {
        setActiveFile(activeWorkflowId, path);
      }
    },
    [activeWorkflowId, setActiveFile],
  );

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
            onSelect={handleSelectFile}
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
