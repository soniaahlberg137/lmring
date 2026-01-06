import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StorageService } from './storage';
import type { SignedUrlOptions, UploadOptions, UploadUrlResult } from './types';

interface SupabaseStorageConfig {
    url: string;
    serviceRoleKey: string;
    bucket: string;
}

export class SupabaseStorage implements StorageService {
    private client: SupabaseClient;
    private bucket: string;

    constructor(config: SupabaseStorageConfig) {
        this.client = createClient(config.url, config.serviceRoleKey);
        this.bucket = config.bucket;
    }

    async createUploadUrl(
        path: string,
        options?: UploadOptions,
    ): Promise<UploadUrlResult> {
        const { data, error } = await this.client.storage
            .from(this.bucket)
            .createSignedUploadUrl(path);

        if (error || !data) {
            throw new Error(`Failed to create upload URL: ${error?.message}`);
        }

        return {
            url: data.signedUrl,
            path: data.path,
            fields: { token: data.token },
        };
    }

    async createDownloadUrl(
        path: string,
        options: SignedUrlOptions = {},
    ): Promise<string> {
        const defaultExpiration = Number.parseInt(
            process.env.SUPABASE_SIGNED_URL_EXPIRATION ?? '3600',
            10,
        );
        const expiresIn = options.expiresIn ?? defaultExpiration;

        const { data, error } = await this.client.storage
            .from(this.bucket)
            .createSignedUrl(path, expiresIn);

        if (error || !data) {
            throw new Error(`Failed to create download URL: ${error?.message}`);
        }

        return data.signedUrl;
    }

    async upload(
        path: string,
        data: Buffer | Blob,
        options?: UploadOptions,
    ): Promise<void> {
        const { error } = await this.client.storage.from(this.bucket).upload(path, data, {
            contentType: options?.contentType,
            upsert: true,
        });

        if (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async delete(path: string): Promise<void> {
        const { error } = await this.client.storage.from(this.bucket).remove([path]);

        if (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async getAsBase64(path: string, mimeType: string): Promise<string> {
        const { data, error } = await this.client.storage.from(this.bucket).download(path);

        if (error || !data) {
            throw new Error(`Failed to download file: ${error?.message}`);
        }

        const buffer = await data.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    async exists(path: string): Promise<boolean> {
        const { data, error } = await this.client.storage.from(this.bucket).list(
            path.split('/').slice(0, -1).join('/'),
            {
                search: path.split('/').pop(),
            },
        );

        if (error) {
            return false;
        }

        return data.length > 0;
    }
}

export function createSupabaseStorage(): SupabaseStorage {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'lmring-files';

    if (!url || !serviceRoleKey) {
        throw new Error(
            'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
        );
    }

    return new SupabaseStorage({ url, serviceRoleKey, bucket });
}
