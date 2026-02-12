'use client';

import { cn, ScrollArea } from '@lmring/ui';
import { FileCode, FileJson, FileText } from 'lucide-react';
import * as React from 'react';
import { useWebDevStore } from '@/stores/webdev-store';

const FILE_TREE_WIDTH = 240;

function getFileIcon(path: string) {
  if (path.endsWith('.json')) return FileJson;
  if (
    path.endsWith('.ts') ||
    path.endsWith('.tsx') ||
    path.endsWith('.js') ||
    path.endsWith('.jsx')
  )
    return FileCode;
  return FileText;
}

function getFileName(path: string): string {
  return path.split('/').pop() ?? path;
}

function getFileDir(path: string): string {
  const parts = path.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
}

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

function FileTree({ files, activeFile, onSelectFile }: FileTreeProps) {
  const sortedPaths = React.useMemo(() => Object.keys(files).sort(), [files]);

  // Group files by directory
  const grouped = React.useMemo(() => {
    const dirs = new Map<string, string[]>();
    for (const path of sortedPaths) {
      const dir = getFileDir(path);
      const existing = dirs.get(dir) ?? [];
      existing.push(path);
      dirs.set(dir, existing);
    }
    return dirs;
  }, [sortedPaths]);

  return (
    <ScrollArea className="h-full" style={{ width: FILE_TREE_WIDTH }}>
      <div className="py-2">
        {Array.from(grouped.entries()).map(([dir, paths]) => (
          <div key={dir || '__root'}>
            {dir && (
              <div
                className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--webdev-editor-text-muted)' }}
              >
                {dir}
              </div>
            )}
            {paths.map((path) => {
              const Icon = getFileIcon(path);
              const isActive = path === activeFile;

              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => onSelectFile(path)}
                  data-active={isActive}
                  className="webdev-file-item w-full text-left"
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: 'var(--webdev-editor-text-muted)' }}
                  />
                  <span
                    className={cn('truncate text-xs', isActive ? 'font-medium' : '')}
                    style={{
                      color: isActive
                        ? 'var(--webdev-editor-text)'
                        : 'var(--webdev-editor-text-muted)',
                    }}
                  >
                    {getFileName(path)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function CodeView() {
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

  const handleSelectFile = React.useCallback(
    (path: string) => {
      if (activeWorkflowId) {
        setActiveFile(activeWorkflowId, path);
      }
    },
    [activeWorkflowId, setActiveFile],
  );

  if (!hasFiles) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: 'var(--webdev-editor-bg)' }}
      >
        <p className="text-sm" style={{ color: 'var(--webdev-editor-text-muted)' }}>
          No files generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--webdev-editor-bg)' }}>
      {/* File tree sidebar */}
      <div
        className="shrink-0 border-r"
        style={{
          backgroundColor: 'var(--webdev-editor-sidebar)',
          borderColor: 'oklch(0.3 0 0 / 0.3)',
        }}
      >
        <FileTree files={files} activeFile={activeFile} onSelectFile={handleSelectFile} />
      </div>

      {/* Code content area */}
      <div className="flex-1 overflow-auto">
        {activeFile ? (
          <ScrollArea className="h-full w-full">
            <pre
              className="p-4 text-xs leading-relaxed"
              style={{ color: 'var(--webdev-editor-text)' }}
            >
              <code>{fileContent}</code>
            </pre>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--webdev-editor-text-muted)' }}>
              Select a file to view
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
