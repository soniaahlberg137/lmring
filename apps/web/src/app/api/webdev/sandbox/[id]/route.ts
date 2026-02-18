import { db, eq } from '@lmring/database';
import { webdevResponses } from '@lmring/database/schema';
import { Sandbox } from '@vercel/sandbox';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { getSandboxCredentials } from '@/libs/webdev-config';

/**
 * DELETE /api/webdev/sandbox/[id]
 *
 * Destroys a running Vercel Sandbox by its sandbox ID.
 * Verifies that the requesting user owns the sandbox via the webdev_responses table.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sandboxId } = await params;

    if (!sandboxId || sandboxId.trim().length === 0) {
      return NextResponse.json({ error: 'Sandbox ID is required' }, { status: 400 });
    }

    const response = await db.query.webdevResponses.findFirst({
      where: eq(webdevResponses.sandboxId, sandboxId),
      with: {
        session: {
          columns: { userId: true },
        },
      },
    });

    if (!response || response.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 });
    }

    try {
      const sandbox = await Sandbox.get({ ...getSandboxCredentials(), sandboxId });
      await sandbox.stop();
    } catch (sandboxError) {
      logError('WebDev sandbox stop warning', sandboxError, { sandboxId });
    }

    await db
      .update(webdevResponses)
      .set({
        status: 'expired',
        sandboxId: null,
        previewUrl: null,
      })
      .where(eq(webdevResponses.id, response.id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError('WebDev sandbox delete error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
