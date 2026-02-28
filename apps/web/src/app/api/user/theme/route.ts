import { db, eq } from '@lmring/database';
import { userPreferences } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { themeConfigSchema } from '@/libs/validation';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    return NextResponse.json({
      themeConfig: preferences?.themeConfig ?? null,
      updatedAt: preferences?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    logError('Get theme config error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const validationResult = themeConfigSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const themeConfig = validationResult.data;

    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          themeConfig,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.id, existing.id))
        .returning();

      return NextResponse.json({
        themeConfig: updated?.themeConfig ?? themeConfig,
        updatedAt: updated?.updatedAt?.toISOString() ?? null,
      });
    }

    const [created] = await db
      .insert(userPreferences)
      .values({
        userId: session.user.id,
        theme: 'system',
        language: 'en',
        configSource: 'manual',
        themeConfig,
      })
      .returning();

    return NextResponse.json(
      {
        themeConfig: created?.themeConfig ?? themeConfig,
        updatedAt: created?.updatedAt?.toISOString() ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    logError('Update theme config error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
