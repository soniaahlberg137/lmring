import type { BundledLanguage } from 'shiki';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

/**
 * Convert flat file paths into a nested tree structure.
 * Sorts folders before files, alphabetically within each group.
 */
export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const filePath of paths.sort()) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const partName = parts[i] as string;
      const isFile = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join('/');

      if (isFile) {
        currentLevel.push({ name: partName, path: partPath, type: 'file' });
      } else {
        let folder = currentLevel.find((n) => n.type === 'folder' && n.name === partName);
        if (!folder) {
          folder = { name: partName, path: partPath, type: 'folder', children: [] };
          currentLevel.push(folder);
        }
        currentLevel = folder.children ?? [];
      }
    }
  }

  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => (n.children ? { ...n, children: sortNodes(n.children) } : n));
  };

  return sortNodes(root);
}

export function getAllFolderPaths(filePaths: string[]): Set<string> {
  const dirs = new Set<string>();
  for (const p of filePaths) {
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
  }
  return dirs;
}

const EXTENSION_MAP: Record<string, BundledLanguage> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  html: 'html',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  svg: 'xml',
  xml: 'xml',
  sh: 'bash',
  bash: 'bash',
  py: 'python',
  rs: 'rust',
  go: 'go',
  sql: 'sql',
  toml: 'toml',
};

const EXT_REGEX = /\.([^.]+)$/;

const FALLBACK_LANG = 'text' as BundledLanguage;

export function getLanguageFromPath(path: string): BundledLanguage {
  const match = path.match(EXT_REGEX);
  if (!match?.[1]) return FALLBACK_LANG;
  return EXTENSION_MAP[match[1].toLowerCase()] ?? FALLBACK_LANG;
}
