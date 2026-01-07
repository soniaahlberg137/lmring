import { tokenBucket } from '@arcjet/next';
import { db, eq } from '@lmring/database';
import { files } from '@lmring/database/schema';
import { FILE_UPLOAD_CONFIG } from '@lmring/env';
import { createStorageService } from '@lmring/storage';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import baseAj from '@/libs/Arcjet';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

const aj = baseAj.withRule(
  tokenBucket({
    mode: 'LIVE',
    refillRate: 10, // 10 uploads per minute
    interval: '1m',
    capacity: 20, // burst of 20
  }),
);

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES),
});

export async function POST(request: Request) {
  try {
    const decision = await aj.protect(request, { requested: 1 });
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rawBody = await request.json();

    const validationResult = uploadRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { filename, mimeType, sizeBytes } = validationResult.data;

    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const ext = filename.split('.').pop() ?? '';
    const storagePath = `users/${userId}/${timestamp}-${randomId}.${ext}`;

    const [fileRecord] = await db
      .insert(files)
      .values({
        userId,
        filename,
        mimeType,
        storagePath,
        sizeBytes,
      })
      .returning();

    if (!fileRecord) {
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 });
    }

    const storage = createStorageService();
    const { url } = await storage.createUploadUrl(storagePath, {
      contentType: mimeType,
    });

    return NextResponse.json({
      fileId: fileRecord.id,
      uploadUrl: url,
      storagePath,
    });
  } catch (error) {
    logError('File upload init error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(files.createdAt);

    return NextResponse.json({ files: userFiles });
  } catch (error) {
    logError('List files error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
