import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { cleanupUserSandboxes } from '@/libs/webdev-resource-manager';

const cleanupSchema = z.object({
  sandboxIds: z.array(z.string().trim().min(1)).min(1).max(10),
});

/**
 * POST /api/webdev/sandbox/cleanup
 *
 * Accepts a list of sandbox IDs to destroy. Designed to be called from
 * `navigator.sendBeacon()` on tab close (which only supports POST).
 * Ownership is enforced by `cleanupUserSandboxes`.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = cleanupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const cleaned = await cleanupUserSandboxes(session.user.id);

    return NextResponse.json({ cleaned }, { status: 200 });
  } catch (error) {
    logError('WebDev sandbox cleanup error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
