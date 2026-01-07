import type { ResponseAttachmentInput } from '@/libs/validation';

export interface DetectedMedia {
  type: 'image' | 'audio' | 'video';
  base64Data: string;
  mimeType: string;
  startIndex: number;
  endIndex: number;
  originalMatch: string;
}

export interface UploadedMedia {
  type: 'image' | 'audio' | 'video';
  key: string;
  mimeType: string;
  filename: string;
  url: string;
  sizeBytes: number;
}

/**
 * Detect base64 media in AI response content (markdown images)
 * Pattern: ![alt](data:image/png;base64,...)
 */
export function detectBase64Media(content: string): DetectedMedia[] {
  const detected: DetectedMedia[] = [];

  const markdownImageRegex = /!\[([^\]]*)\]\((data:(image\/[^;]+);base64,([^)]+))\)/g;

  for (const match of content.matchAll(markdownImageRegex)) {
    const fullMatch = match[0];
    const dataUrl = match[2];
    const mimeType = match[3];

    if (dataUrl && mimeType) {
      detected.push({
        type: 'image',
        base64Data: dataUrl,
        mimeType,
        startIndex: match.index ?? 0,
        endIndex: (match.index ?? 0) + fullMatch.length,
        originalMatch: fullMatch,
      });
    }
  }

  return detected;
}

/**
 * Convert base64 data URL to File object
 *
 * PERFORMANCE NOTE: This function creates multiple memory copies:
 * 1. The original base64 string
 * 2. The decoded binary string from atob()
 * 3. The ArrayBuffer
 * 4. The Uint8Array view
 * 5. The final File blob
 *
 * For large files (>5MB), consider server-side processing to avoid
 * client memory pressure. Files larger than ~50MB may cause memory
 * issues on mobile devices or low-memory environments.
 */
export function base64ToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';

  const byteString = atob(base64 ?? '');
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new File([uint8Array], filename, { type: mimeType });
}

/**
 * Upload a file and return both URL and storage path
 */
async function uploadFileWithPath(file: File): Promise<{
  fileId: string;
  storagePath: string;
  url: string;
  mimeType: string;
}> {
  const initResponse = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to initialize upload');
  }

  const { fileId, uploadUrl, storagePath } = await initResponse.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to storage');
  }

  const urlResponse = await fetch(`/api/files/${fileId}/url`);

  if (!urlResponse.ok) {
    const error = await urlResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get file URL');
  }

  const urlData = await urlResponse.json();

  return {
    fileId,
    storagePath,
    url: urlData.url || urlData.base64,
    mimeType: urlData.mimeType,
  };
}

/**
 * Upload detected media to storage and return upload results
 */
export async function uploadDetectedMedia(
  detected: DetectedMedia[],
): Promise<Map<string, UploadedMedia>> {
  const uploadResults = new Map<string, UploadedMedia>();

  await Promise.all(
    detected.map(async (media, index) => {
      const ext = media.mimeType.split('/')[1] ?? 'bin';
      const filename = `ai-generated-${Date.now()}-${index}.${ext}`;
      const file = base64ToFile(media.base64Data, filename);

      try {
        const result = await uploadFileWithPath(file);
        uploadResults.set(media.originalMatch, {
          type: media.type,
          key: result.storagePath,
          mimeType: media.mimeType,
          filename,
          url: result.url,
          sizeBytes: file.size,
        });
      } catch (error) {
        console.error('Failed to upload AI-generated media:', error);
      }
    }),
  );

  return uploadResults;
}

/**
 * Replace base64 content with storage URLs in response text
 */
export function replaceBase64WithUrls(
  content: string,
  uploadResults: Map<string, UploadedMedia>,
): string {
  let result = content;

  for (const [originalMatch, media] of uploadResults) {
    const replacement = `![${media.filename}](${media.url})`;
    result = result.replace(originalMatch, replacement);
  }

  return result;
}

/**
 * Process AI response content: detect, upload, and return processed content + attachments
 */
export async function processAiResponseMedia(content: string): Promise<{
  processedContent: string;
  attachments: ResponseAttachmentInput[];
}> {
  const detected = detectBase64Media(content);

  if (detected.length === 0) {
    return { processedContent: content, attachments: [] };
  }

  const uploadResults = await uploadDetectedMedia(detected);
  const processedContent = replaceBase64WithUrls(content, uploadResults);

  const attachments: ResponseAttachmentInput[] = Array.from(uploadResults.values()).map(
    (media) => ({
      type: media.type,
      key: media.key,
      mimeType: media.mimeType,
      filename: media.filename,
      sizeBytes: media.sizeBytes,
    }),
  );

  return { processedContent, attachments };
}
