import { db, desc } from '@lmring/database';
import { agents } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'models';

    if (type === 'agents') {
      const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
      const offset = Number(searchParams.get('offset') ?? '0');

      const rows = await db
        .select()
        .from(agents)
        .orderBy(desc(agents.createdAt))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({ data: rows, total_count: rows.length, limit, offset });
    }

    // Default: proxy ZeroEval model leaderboard
    const arena = searchParams.get('arena');
    if (!arena) {
      return NextResponse.json({ error: 'Missing required parameter: arena' }, { status: 400 });
    }

    const limit = searchParams.get('limit') ?? '200';
    const offset = searchParams.get('offset') ?? '0';

    const upstreamParams = new URLSearchParams({ limit, offset });
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

    return NextResponse.json(await response.json());
  } catch (error) {
    logError('GET /api/leaderboard error', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
