import { db, eq } from '@lmring/database';
import { webdevIterations, webdevResponses, webdevSessions } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { webdevGenerateSchema } from '@/libs/webdev-validation';

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

    const { prompt, models } = validationResult.data;

    // 1. Create session
    const [newSession] = await db
      .insert(webdevSessions)
      .values({
        userId,
        prompt,
        status: 'generating',
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
    await db.insert(webdevIterations).values({
      sessionId: newSession.id,
      prompt,
      version: 1,
    });

    return NextResponse.json(
      {
        sessionId: newSession.id,
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
