import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { getWebDevConfig } from '@/libs/webdev-config';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getWebDevConfig();

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    logError('WebDev config check error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
