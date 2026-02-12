import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { extendSandboxTimeout } from '@/libs/webdev-resource-manager';

const heartbeatSchema = z.object({
  sandboxId: z.string().trim().min(1),
});

/**
 * POST /api/webdev/sandbox/heartbeat
 *
 * Client calls this periodically (every ~4 min) to extend sandbox timeout.
 * The resource manager debounces calls to avoid excessive Sandbox API requests.
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
    const result = heartbeatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const extended = await extendSandboxTimeout(result.data.sandboxId);

    return NextResponse.json({ extended }, { status: 200 });
  } catch (error) {
    logError('WebDev sandbox heartbeat error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
