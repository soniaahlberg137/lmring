'use client';

import { cn, ScrollArea } from '@lmring/ui';
import { FileCode, FileJson, FileText, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useWebDevStore } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';

const FILE_TREE_WIDTH = 240;

interface StreamingFile {
  path: string;
  content: string;
  isStreaming: boolean;
}

/**
 * Progressively parse `---FILE:---` / `---END FILE---` markers from streaming content.
 * Returns completed files and the currently-streaming file (if any).
 */
function parseStreamingContent(content: string): {
  files: StreamingFile[];
  currentFile: StreamingFile | null;
} {
  const files: StreamingFile[] = [];

  const regex = /---FILE:\s*(.+?)\s*---\s*\n([\s\S]*?)---END FILE---/g;
  let lastEndIndex = 0;

  for (let match = regex.exec(content); match !== null; match = regex.exec(content)) {
    const path = match[1]?.trim();
    if (path) {
      files.push({ path, content: match[2] ?? '', isStreaming: false });
    }
    lastEndIndex = regex.lastIndex;
  }

  const remaining = content.slice(lastEndIndex);
  const currentFileMatch = remaining.match(/---FILE:\s*(.+?)\s*---\s*\n([\s\S]*)$/);
  const currentFile = currentFileMatch?.[1]?.trim()
    ? { path: currentFileMatch[1].trim(), content: currentFileMatch[2] ?? '', isStreaming: true }
    : null;

  return { files, currentFile };
}

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

export function StreamingCodeView() {
  const { t } = useTranslation();
  const activeWorkflowId = useWebDevStore((s) => s.activeWorkflowId);

  const streamingContent = useWorkflowStore((s) => {
    if (!activeWorkflowId) return '';
    const wf = s.workflows.get(activeWorkflowId);
    if (wf?.pendingResponse?.content) return wf.pendingResponse.content;
    if (wf?.status === 'completed') {
      const lastAssistant = wf.messages.findLast((m) => m.role === 'assistant');
      return lastAssistant?.content ?? '';
    }
    return '';
  });

  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { files, currentFile } = React.useMemo(
    () => parseStreamingContent(streamingContent),
    [streamingContent],
  );

  const allFiles = React.useMemo(() => {
    const result = [...files];
    if (currentFile) {
      result.push(currentFile);
    }
    return result;
  }, [files, currentFile]);

  const activeFile = React.useMemo(() => {
    if (selectedFile && allFiles.some((f) => f.path === selectedFile)) {
      return selectedFile;
    }
    return currentFile?.path ?? files[files.length - 1]?.path ?? null;
  }, [selectedFile, allFiles, currentFile, files]);

  const activeFileData = allFiles.find((f) => f.path === activeFile);

  const contentForScroll = activeFileData?.isStreaming ? activeFileData.content : null;
  React.useEffect(() => {
    if (contentForScroll != null) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [contentForScroll]);

  const hasFiles = allFiles.length > 0;

  if (!hasFiles) {
    return (
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--webdev-editor-bg)' }}>
        <div
          className="flex items-center gap-2 border-b px-4 py-2"
          style={{ borderColor: 'oklch(0.3 0 0 / 0.3)' }}
        >
          <Loader2
            className="h-3.5 w-3.5 animate-spin"
            style={{ color: 'var(--webdev-editor-text-muted)' }}
          />
          <span className="text-xs" style={{ color: 'var(--webdev-editor-text-muted)' }}>
            {t('WebDev.generating_code')}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <pre
            className="p-4 text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--webdev-editor-text)' }}
          >
            <code>{streamingContent}</code>
          </pre>
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--webdev-editor-bg)' }}>
      <div
        className="shrink-0 border-r"
        style={{
          backgroundColor: 'var(--webdev-editor-sidebar)',
          borderColor: 'oklch(0.3 0 0 / 0.3)',
          width: FILE_TREE_WIDTH,
        }}
      >
        <ScrollArea className="h-full">
          <div className="py-2">
            {allFiles.map((file) => {
              const Icon = getFileIcon(file.path);
              const isActive = file.path === activeFile;

              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFile(file.path)}
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
                    {getFileName(file.path)}
                  </span>
                  {file.isStreaming && (
                    <Loader2
                      className="ml-auto h-3 w-3 shrink-0 animate-spin"
                      style={{ color: 'var(--webdev-editor-text-muted)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-auto">
        {activeFileData ? (
          <ScrollArea className="h-full w-full">
            <pre
              className="p-4 text-xs leading-relaxed"
              style={{ color: 'var(--webdev-editor-text)' }}
            >
              <code>{activeFileData.content}</code>
            </pre>
            <div ref={bottomRef} />
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
