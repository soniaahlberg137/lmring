export type { StorageFile, UploadOptions, SignedUrlOptions, UploadUrlResult } from './types';
export type { StorageService } from './storage';
export { SupabaseStorage, createSupabaseStorage } from './supabase-storage';
export { S3Storage, createS3Storage } from './s3-storage';

import type { StorageService } from './storage';
import { createS3Storage } from './s3-storage';
import { createSupabaseStorage } from './supabase-storage';

export function createStorageService(): StorageService {
    const deploymentMode = process.env.DEPLOYMENT_MODE ?? 'saas';

    if (deploymentMode === 'selfhost') {
        return createS3Storage();
    }

    return createSupabaseStorage();
}

export function shouldUseBase64ForAI(): boolean {
    return process.env.LLM_IMAGE_BASE64 === '1';
}
