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
}

export const MAX_IMAGES = 10;
export const MAX_IMAGE_SIZE_MB = 15;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const INPUT_MODE_ABILITY_MAP = {
  search: 'search',
  imageGenerate: 'imageOutput',
  upload: 'vision',
} as const;

export type InputModeAbilityKey =
  (typeof INPUT_MODE_ABILITY_MAP)[keyof typeof INPUT_MODE_ABILITY_MAP];
