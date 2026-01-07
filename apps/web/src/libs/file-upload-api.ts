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

export async function uploadFile(file: File): Promise<UploadedFileResult> {
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

export async function getFileUrl(fileId: string): Promise<FileUrlResult> {
  const response = await fetch(`/api/files/${fileId}/url`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get file URL');
  }

  return response.json();
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/files/${fileId}/url`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete file');
  }
}

export async function deleteFileWithRetry(
  fileId: string,
  maxRetries = 3,
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await deleteFile(fileId);
      return { success: true };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      // Exponential backoff: 500ms, 1000ms, 2000ms
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** i * 500));
      }
    }
  }

  return { success: false, error: lastError?.message };
}
