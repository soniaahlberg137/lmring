'use client';

import { ScrollArea } from '@lmring/ui';
import { FileIcon, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeBlockContent } from '@/components/ai-elements/code-block';
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree';
import { useWebDevStore } from '@/stores/webdev-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import {
  buildFileTree,
  type FileTreeNode,
  getAllFolderPaths,
  getLanguageFromPath,
} from './utils/file-tree-utils';

const FILE_TREE_WIDTH = 240;

interface StreamingFile {
  path: string;
  content: string;
  isStreaming: boolean;
}

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

function renderStreamingTreeNodes(
  nodes: FileTreeNode[],
  streamingPaths: Set<string>,
): React.ReactNode {
  return nodes.map((node) => {
    if (node.type === 'folder') {
      return (
        <FileTreeFolder key={node.path} path={node.path} name={node.name}>
          {node.children && renderStreamingTreeNodes(node.children, streamingPaths)}
        </FileTreeFolder>
      );
    }

    if (streamingPaths.has(node.path)) {
      return (
        <FileTreeFile key={node.path} path={node.path} name={node.name}>
          <span className="w-3.5 shrink-0" />
          <span className="flex shrink-0 items-center">
            <FileIcon className="size-4 text-muted-foreground" />
          </span>
          <span className="truncate">{node.name}</span>
          <Loader2 className="ml-auto size-3 shrink-0 animate-spin text-muted-foreground" />
        </FileTreeFile>
      );
    }

    return <FileTreeFile key={node.path} path={node.path} name={node.name} />;
  });
}

export function StreamingCodeView() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
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

  const filePaths = React.useMemo(() => allFiles.map((f) => f.path), [allFiles]);
  const treeNodes = React.useMemo(() => buildFileTree(filePaths), [filePaths]);
  const streamingPaths = React.useMemo(
    () => new Set(allFiles.filter((f) => f.isStreaming).map((f) => f.path)),
    [allFiles],
  );

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    const allDirs = getAllFolderPaths(filePaths);
    setExpanded((prev) => {
      const merged = new Set(prev);
      for (const d of allDirs) merged.add(d);
      return merged.size === prev.size ? prev : merged;
    });
  }, [filePaths]);

  if (!hasFiles) {
    return (
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--webdev-editor-bg)' }}>
        <div
          className="flex items-center gap-2 border-b px-4 py-2"
          style={{ borderColor: 'var(--webdev-editor-border)' }}
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

  const language = getLanguageFromPath(activeFile ?? '');

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
            expanded={expanded}
            onExpandedChange={setExpanded}
            selectedPath={activeFile ?? undefined}
            onSelect={setSelectedFile}
            className="rounded-none border-0 bg-transparent text-xs"
          >
            {renderStreamingTreeNodes(treeNodes, streamingPaths)}
          </FileTree>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-auto">
        {activeFileData ? (
          <ScrollArea className="h-full w-full">
            {activeFileData.isStreaming ? (
              <pre
                className="p-4 text-xs leading-relaxed"
                style={{ color: 'var(--webdev-editor-text)' }}
              >
                <code>{activeFileData.content}</code>
              </pre>
            ) : (
              <CodeBlockContent
                code={activeFileData.content}
                language={language}
                showLineNumbers
                theme={codeTheme}
              />
            )}
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
