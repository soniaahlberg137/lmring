export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map(fileToDataUrl));
}

export interface ImageAttachment {
  type: 'image';
  data: string;
  mediaType: string;
  filename?: string;
}

export async function fileToImageAttachment(file: File): Promise<ImageAttachment> {
  const dataUrl = await fileToDataUrl(file);
  return {
    type: 'image',
    data: dataUrl,
    mediaType: file.type,
    filename: file.name,
  };
}

export async function filesToImageAttachments(files: File[]): Promise<ImageAttachment[]> {
  return Promise.all(files.map(fileToImageAttachment));
}
