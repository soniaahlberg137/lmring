import type { SignedUrlOptions, UploadOptions, UploadUrlResult } from './types';

export interface StorageService {
    createUploadUrl(path: string, options?: UploadOptions): Promise<UploadUrlResult>;
    createDownloadUrl(path: string, options?: SignedUrlOptions): Promise<string>;
    upload(path: string, data: Buffer | Blob, options?: UploadOptions): Promise<void>;
    delete(path: string): Promise<void>;
    getAsBase64(path: string, mimeType: string): Promise<string>;
    exists(path: string): Promise<boolean>;
}
