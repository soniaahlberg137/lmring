import { db } from '@lmring/database';
import { userPreferences } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    const [result] = await db
      .insert(userPreferences)
      .values({
        userId,
        todayClearedAt: now,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          todayClearedAt: now,
          updatedAt: now,
        },
      })
      .returning({ todayClearedAt: userPreferences.todayClearedAt });

    return NextResponse.json({ clearedAt: result?.todayClearedAt ?? now }, { status: 200 });
  } catch (error) {
    logError('Clear today conversations error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
