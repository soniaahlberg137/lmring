import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Default to true if not specified (backwards compatible)
    const justCanonicals = searchParams.get('justCanonicals') !== 'false';

    const url = `${ZEROEVAL_API}/leaderboard/models/full${justCanonicals ? '?justCanonicals=true' : ''}`;

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
    logError('ZeroEval models/full proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch from ZeroEval API' }, { status: 500 });
  }
}
