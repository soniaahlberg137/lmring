import { and, db, eq, inArray } from '@lmring/database';
import { files } from '@lmring/database/schema';
import { createStorageService } from '@lmring/storage';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

const cleanupSchema = z.object({
  fileIds: z.array(z.string().uuid()),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const validationResult = cleanupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { fileIds } = validationResult.data;

    if (fileIds.length === 0) {
      return NextResponse.json({ cleaned: 0 });
    }

    // Get files that belong to this user
    const userFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), inArray(files.id, fileIds)));

    if (userFiles.length === 0) {
      return NextResponse.json({ cleaned: 0 });
    }

    const storage = createStorageService();

    // Delete files in parallel
    await Promise.allSettled(
      userFiles.map(async (file) => {
        await storage.delete(file.storagePath);
        await db.delete(files).where(eq(files.id, file.id));
      }),
    );

    return NextResponse.json({ cleaned: userFiles.length });
  } catch (error) {
    logError('File cleanup error', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
