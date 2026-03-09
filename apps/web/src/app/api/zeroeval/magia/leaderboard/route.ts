import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const arena = searchParams.get('arena');
    if (!arena) {
      return NextResponse.json({ error: 'Missing required parameter: arena' }, { status: 400 });
    }

    const limit = searchParams.get('limit') || '200';
    const offset = searchParams.get('offset') || '0';

    const upstreamParams = new URLSearchParams();
    upstreamParams.set('limit', limit);
    upstreamParams.set('offset', offset);

    const url = `${ZEROEVAL_API}/magia/arenas/${encodeURIComponent(arena)}/leaderboard?${upstreamParams}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logError('ZeroEval magia/leaderboard proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch from ZeroEval API' }, { status: 500 });
  }
}
