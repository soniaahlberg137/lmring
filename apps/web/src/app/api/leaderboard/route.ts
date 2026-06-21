import { db, desc } from '@lmring/database';
import { agents } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';
import { LEGAL_LEADERBOARD_FIXTURE } from '@/libs/legal-leaderboard-fixture';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'models';
    const domain = searchParams.get('domain');

    // Tessera: assembled-agent (harness × model) matrix for the legal domain.
    // TODO(integration): replace the fixture with a real DB read from Lane C's
    // `eval_runs` / `run_scores` tables once persistence is wired in. Honor the
    // `suite` query param (defaults to 'legal_contract_review') when querying.
    if (domain === 'legal') {
      return NextResponse.json({ rows: LEGAL_LEADERBOARD_FIXTURE });
    }

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
