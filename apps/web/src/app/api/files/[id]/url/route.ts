import { and, db, eq } from '@lmring/database';
import { files } from '@lmring/database/schema';
import { createStorageService, shouldUseBase64ForAI } from '@lmring/storage';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const storage = createStorageService();

    if (shouldUseBase64ForAI()) {
      const base64 = await storage.getAsBase64(fileRecord.storagePath, fileRecord.mimeType);
      return NextResponse.json({
        fileId: fileRecord.id,
        base64,
        mimeType: fileRecord.mimeType,
      });
    }

    // NOTE: Signed URLs expire after 1 hour (3600 seconds).
    // For long-running conversations, URLs should be re-fetched when displaying
    // historical messages. The current architecture assumes URLs are fetched
    // on-demand when displaying content, which naturally refreshes them.
    const url = await storage.createDownloadUrl(fileRecord.storagePath, {
      expiresIn: 3600,
    });

    return NextResponse.json({
      fileId: fileRecord.id,
      url,
      mimeType: fileRecord.mimeType,
    });
  } catch (error) {
    logError('Get file URL error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const storage = createStorageService();
    await storage.delete(fileRecord.storagePath);

    await db.delete(files).where(eq(files.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Delete file error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
