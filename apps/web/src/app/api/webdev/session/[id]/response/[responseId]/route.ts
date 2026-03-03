import { and, db, eq } from '@lmring/database';
import { webdevResponses, webdevSessions } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId, responseId } = await params;

    const [webdevSession] = await db
      .select({ id: webdevSessions.id })
      .from(webdevSessions)
      .where(and(eq(webdevSessions.id, sessionId), eq(webdevSessions.userId, session.user.id)))
      .limit(1);

    if (!webdevSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = (await request.json()) as { content?: string };
    if (typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    await db
      .update(webdevResponses)
      .set({ content: body.content })
      .where(and(eq(webdevResponses.id, responseId), eq(webdevResponses.sessionId, sessionId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('Save webdev response content error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
