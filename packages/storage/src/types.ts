/**
 * Storage types for file upload and management
 */

export interface StorageFile {
    id: string;
    bucket: string;
    path: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
}

export interface UploadOptions {
    contentType?: string;
    metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
    expiresIn?: number;
}

export interface UploadUrlResult {
    url: string;
    path: string;
    fields?: Record<string, string>;
}
