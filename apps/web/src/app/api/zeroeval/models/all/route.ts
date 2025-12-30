import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

const ZEROEVAL_API = 'https://api.zeroeval.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward query parameters
    const upstreamParams = new URLSearchParams();
    const modelType = searchParams.get('model_type');
    const inputModality = searchParams.get('input_modality');
    const outputModality = searchParams.get('output_modality');

    if (modelType) upstreamParams.set('model_type', modelType);
    if (inputModality) upstreamParams.set('input_modality', inputModality);
    if (outputModality) upstreamParams.set('output_modality', outputModality);

    const queryString = upstreamParams.toString();
    const url = `${ZEROEVAL_API}/leaderboard/models/all${queryString ? `?${queryString}` : ''}`;

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
    logError('ZeroEval models/all proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch from ZeroEval API' }, { status: 500 });
  }
}
