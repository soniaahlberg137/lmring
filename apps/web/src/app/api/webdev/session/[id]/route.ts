import { and, asc, db, desc, eq } from '@lmring/database';
import { webdevIterations, webdevResponses, webdevSessions } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: sessionId } = await params;

    // Verify session exists and belongs to user
    const [webdevSession] = await db
      .select()
      .from(webdevSessions)
      .where(and(eq(webdevSessions.id, sessionId), eq(webdevSessions.userId, userId)))
      .limit(1);

    if (!webdevSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch responses and iterations in parallel
    const [responses, iterations] = await Promise.all([
      db
        .select()
        .from(webdevResponses)
        .where(eq(webdevResponses.sessionId, sessionId))
        .orderBy(asc(webdevResponses.displayPosition)),
      db
        .select()
        .from(webdevIterations)
        .where(eq(webdevIterations.sessionId, sessionId))
        .orderBy(desc(webdevIterations.version)),
    ]);

    return NextResponse.json(
      {
        session: webdevSession,
        responses,
        iterations,
      },
      { status: 200 },
    );
  } catch (error) {
    logError('Get webdev session error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
