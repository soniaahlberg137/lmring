import { strToU8, zipSync } from 'fflate';

/**
 * Slugify a prompt string into a filesystem-safe filename.
 * Falls back to 'webdev-project' for empty/whitespace-only input.
 */
export function promptToFilename(prompt: string): string {
  const slug = prompt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) return 'webdev-project';

  return slug.slice(0, 50).replace(/-+$/, '');
}

/**
 * Create a zip from in-memory files and trigger a browser download.
 * @param files - Record of file path → content
 * @param zipFilename - Name for the downloaded zip file
 */
export function downloadFilesAsZip(files: Record<string, string>, zipFilename: string): void {
  const entries = Object.entries(files);
  if (entries.length === 0) {
    throw new Error('No files to download');
  }

  const zipData: Record<string, Uint8Array> = {};
  for (const [path, content] of entries) {
    // Strip leading slash to avoid absolute paths in the zip
    const normalizedPath = path.replace(/^\/+/, '');
    zipData[normalizedPath] = strToU8(content);
  }

  const zipped = zipSync(zipData);
  const blob = new Blob([zipped as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
