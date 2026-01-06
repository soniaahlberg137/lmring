import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageService } from './storage';
import type { SignedUrlOptions, UploadOptions, UploadUrlResult } from './types';

interface S3StorageConfig {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    forcePathStyle?: boolean;
}

export class S3Storage implements StorageService {
    private client: S3Client;
    private bucket: string;

    constructor(config: S3StorageConfig) {
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: config.forcePathStyle ?? true,
        });
        this.bucket = config.bucket;
    }

    async createUploadUrl(
        path: string,
        options?: UploadOptions,
    ): Promise<UploadUrlResult> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            ContentType: options?.contentType,
        });

        const url = await getSignedUrl(this.client, command, {
            expiresIn: 3600,
        });

        return {
            url,
            path,
        };
    }

    async createDownloadUrl(
        path: string,
        options: SignedUrlOptions = {},
    ): Promise<string> {
        const expiresIn = options.expiresIn ?? 3600;

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        return getSignedUrl(this.client, command, { expiresIn });
    }

    async upload(
        path: string,
        data: Buffer | Blob,
        options?: UploadOptions,
    ): Promise<void> {
        let body: Buffer;

        if (data instanceof Blob) {
            const arrayBuffer = await data.arrayBuffer();
            body = Buffer.from(arrayBuffer);
        } else {
            body = data;
        }

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: body,
            ContentType: options?.contentType ?? 'application/octet-stream',
        });

        await this.client.send(command);
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        await this.client.send(command);
    }

    async getAsBase64(path: string, mimeType: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error(`Failed to get object: ${path}`);
        }

        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }

    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: path,
            });
            await this.client.send(command);
            return true;
        } catch {
            return false;
        }
    }
}

export function createS3Storage(): S3Storage {
    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = process.env.MINIO_PORT ?? '9000';
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    const bucket = process.env.MINIO_BUCKET ?? 'lmring-files';
    const region = process.env.MINIO_REGION ?? 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
        throw new Error(
            'Missing S3/MinIO configuration: MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required',
        );
    }

    const protocol = useSSL ? 'https' : 'http';
    const fullEndpoint = `${protocol}://${endpoint}:${port}`;

    return new S3Storage({
        endpoint: fullEndpoint,
        region,
        accessKeyId,
        secretAccessKey,
        bucket,
        forcePathStyle: true,
    });
}
