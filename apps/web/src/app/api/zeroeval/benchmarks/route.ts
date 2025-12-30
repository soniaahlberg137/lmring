import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET() {
  try {
    const response = await fetch(`${ZEROEVAL_API}/leaderboard/benchmarks`, {
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
    logError('ZeroEval benchmarks proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch from ZeroEval API' }, { status: 500 });
  }
}
