import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward query parameters
    const upstreamParams = new URLSearchParams();
    const modelIds = searchParams.get('model_ids');
    const arenaNames = searchParams.get('arena_names');

    if (modelIds) upstreamParams.set('model_ids', modelIds);
    if (arenaNames) upstreamParams.set('arena_names', arenaNames);

    const queryString = upstreamParams.toString();
    const url = `${ZEROEVAL_API}/magia/models/scores${queryString ? `?${queryString}` : ''}`;

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
    logError('ZeroEval arena-scores proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch from ZeroEval API' }, { status: 500 });
  }
}
