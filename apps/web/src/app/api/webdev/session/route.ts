import { and, asc, db, desc, eq } from '@lmring/database';
import { webdevIterations, webdevResponses, webdevSessions } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { cleanupSessionSandboxes } from '@/libs/webdev-resource-manager';
import { webdevFollowUpSchema, webdevGenerateSchema } from '@/libs/webdev-validation';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rawBody = await request.json();

    const validationResult = webdevGenerateSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { prompt, models, conversationId } = validationResult.data;

    const staleSessions = await db.query.webdevSessions.findMany({
      where: and(eq(webdevSessions.userId, userId), eq(webdevSessions.status, 'generating')),
      columns: { id: true },
    });

    for (const stale of staleSessions) {
      await cleanupSessionSandboxes(stale.id);
      await db
        .update(webdevSessions)
        .set({ status: 'ready' })
        .where(eq(webdevSessions.id, stale.id));
    }

    // 1. Create session
    const [newSession] = await db
      .insert(webdevSessions)
      .values({
        userId,
        prompt,
        status: 'generating',
        ...(conversationId ? { conversationId } : {}),
      })
      .returning();

    if (!newSession) {
      throw new Error('Failed to create webdev session');
    }

    // 2. Create one response per model (with displayPosition 0-N)
    const responseValues = models.map((model, index) => ({
      sessionId: newSession.id,
      modelId: model.modelId,
      keyId: model.keyId,
      status: 'generating' as const,
      displayPosition: index,
    }));

    const newResponses = await db.insert(webdevResponses).values(responseValues).returning();

    // 3. Create initial iteration (version 1)
    const [firstIteration] = await db
      .insert(webdevIterations)
      .values({
        sessionId: newSession.id,
        prompt,
        version: 1,
      })
      .returning();

    return NextResponse.json(
      {
        sessionId: newSession.id,
        iteration: firstIteration ? { id: firstIteration.id, version: 1, prompt } : null,
        responses: newResponses.map((r) => ({
          id: r.id,
          modelId: r.modelId,
          displayPosition: r.displayPosition,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    logError('Create webdev session error', error);
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

    const userSessions = await db
      .select()
      .from(webdevSessions)
      .where(eq(webdevSessions.userId, userId))
      .orderBy(webdevSessions.createdAt);

    return NextResponse.json({ sessions: userSessions }, { status: 200 });
  } catch (error) {
    logError('List webdev sessions error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rawBody = await request.json();
    const result = webdevFollowUpSchema.safeParse(rawBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 },
      );
    }

    const { sessionId, prompt } = result.data;

    // Verify ownership
    const [webdevSession] = await db
      .select()
      .from(webdevSessions)
      .where(and(eq(webdevSessions.id, sessionId), eq(webdevSessions.userId, userId)))
      .limit(1);

    if (!webdevSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { newIteration, newResponses } = await db.transaction(async (tx) => {
      const [latestIteration] = await tx
        .select({ version: webdevIterations.version })
        .from(webdevIterations)
        .where(eq(webdevIterations.sessionId, sessionId))
        .orderBy(desc(webdevIterations.version))
        .limit(1);

      const nextVersion = (latestIteration?.version ?? 0) + 1;

      const [newIteration] = await tx
        .insert(webdevIterations)
        .values({ sessionId, prompt, version: nextVersion })
        .returning();

      if (!newIteration) {
        throw new Error('Failed to create iteration');
      }

      const originalResponses = await tx
        .select({
          modelId: webdevResponses.modelId,
          keyId: webdevResponses.keyId,
          displayPosition: webdevResponses.displayPosition,
        })
        .from(webdevResponses)
        .where(eq(webdevResponses.sessionId, sessionId))
        .orderBy(asc(webdevResponses.displayPosition));

      const seenPositions = new Set<number>();
      const uniqueModels = originalResponses.filter((r) => {
        if (seenPositions.has(r.displayPosition)) return false;
        seenPositions.add(r.displayPosition);
        return true;
      });

      const newResponses = await tx
        .insert(webdevResponses)
        .values(
          uniqueModels.map((r) => ({
            sessionId,
            iterationId: newIteration.id,
            modelId: r.modelId,
            keyId: r.keyId,
            status: 'generating' as const,
            displayPosition: r.displayPosition,
          })),
        )
        .returning();

      await tx
        .update(webdevSessions)
        .set({ prompt, status: 'generating', updatedAt: new Date() })
        .where(eq(webdevSessions.id, sessionId));

      return { newIteration, newResponses };
    });

    return NextResponse.json({
      iteration: {
        id: newIteration.id,
        version: newIteration.version,
        prompt: newIteration.prompt,
      },
      responses: newResponses.map((r) => ({
        id: r.id,
        modelId: r.modelId,
        displayPosition: r.displayPosition,
      })),
    });
  } catch (error) {
    logError('Follow-up webdev session error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
