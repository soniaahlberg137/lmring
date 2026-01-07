import { FILE_UPLOAD_CONFIG } from '@lmring/env';

export type InputMode = 'default' | 'search' | 'imageGenerate' | 'upload';

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  size: number;
  fileId?: string;
  url?: string;
  isUploading?: boolean;
  uploadError?: string;
  deleteError?: string;
  deleteRetryCount?: number;
}

export const MAX_IMAGES = FILE_UPLOAD_CONFIG.MAX_IMAGES;
export const MAX_IMAGE_SIZE_MB = FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB;
export const MAX_IMAGE_SIZE_BYTES = FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES;

export const INPUT_MODE_ABILITY_MAP = {
  search: 'search',
  imageGenerate: 'imageOutput',
  upload: 'vision',
} as const;

export type InputModeAbilityKey =
  (typeof INPUT_MODE_ABILITY_MAP)[keyof typeof INPUT_MODE_ABILITY_MAP];
