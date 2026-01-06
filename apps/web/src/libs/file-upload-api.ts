/**
 * File upload API client for arena page
 */

export interface UploadedFileResult {
  fileId: string;
  url: string;
  mimeType: string;
  filename: string;
}

export interface FileUrlResult {
  fileId: string;
  url?: string;
  base64?: string;
  mimeType: string;
}

/**
 * Upload a file to storage and return the file ID and URL
 *
 * Flow:
 * 1. POST /api/files/upload - Get signed upload URL and file ID
 * 2. PUT to signed URL - Upload file content
 * 3. GET /api/files/[id]/url - Get download URL
 */
export async function uploadFile(file: File): Promise<UploadedFileResult> {
  // Step 1: Get upload URL from our API
  const initResponse = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  const { fileId, uploadUrl } = await initResponse.json();

  // Step 2: Upload file to signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to storage');
  }

  // Step 3: Get the download URL
  const urlResponse = await fetch(`/api/files/${fileId}/url`);

  if (!urlResponse.ok) {
    const error = await urlResponse.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get file URL');
  }

  const urlData = await urlResponse.json();

  return {
    fileId,
    url: urlData.url || urlData.base64,
    mimeType: urlData.mimeType,
    filename: file.name,
  };
}

/**
 * Get file URL/base64 for an already uploaded file
 */
export async function getFileUrl(fileId: string): Promise<FileUrlResult> {
  const response = await fetch(`/api/files/${fileId}/url`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get file URL');
  }

  return response.json();
}
