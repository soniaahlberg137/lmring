import type { WebDevFile } from '@/types/webdev';

/**
 * Regex to match file markers in AI-generated output.
 *
 * Expected format:
 * ```
 * ---FILE: src/App.tsx---
 * ...file content...
 * ---END FILE---
 * ```
 *
 * Supports optional trailing whitespace on marker lines.
 */
const FILE_MARKER_REGEX = /---FILE:\s*(.+?)\s*---\s*\n([\s\S]*?)---END FILE---/g;

/**
 * Parse AI-generated output into a list of files.
 *
 * Extracts all `---FILE: path---` / `---END FILE---` blocks from the raw
 * model output. If no markers are found, returns an empty array.
 *
 * @param rawOutput - The complete AI model response text
 * @returns Array of `{ path, content }` file entries
 */
export function parseGeneratedFiles(rawOutput: string): WebDevFile[] {
  const files: WebDevFile[] = [];

  // Reset regex state (global flag)
  FILE_MARKER_REGEX.lastIndex = 0;

  for (
    let match = FILE_MARKER_REGEX.exec(rawOutput);
    match !== null;
    match = FILE_MARKER_REGEX.exec(rawOutput)
  ) {
    const path = match[1]?.trim();
    const content = match[2] ?? '';

    if (path) {
      files.push({ path, content });
    }
  }

  return files;
}

/**
 * Convert a WebDevFile array to a Record<path, content> map.
 * Used by the webdev store which stores files as `Record<string, string>`.
 */
export function filesToRecord(files: WebDevFile[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const file of files) {
    record[file.path] = file.content;
  }
  return record;
}
