import { db, eq, inArray } from '@lmring/database';
import type { ZevalArenaEntry } from '@lmring/database/schema';
import { zevalArenaEntries } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

function toMagiaItem(row: ZevalArenaEntry) {
  return {
    variant_id: row.variantId,
    variant_key: row.variantKey,
    model_id: row.modelId,
    model_name: row.modelName,
    organization: row.organization,
    mu: row.mu,
    sigma: row.sigma,
    conservative_rating: row.conservativeRating,
    rating_change_7d: row.ratingChange7d,
    matches_played: row.matchesPlayed,
    wins: row.wins,
    win_rate: row.winRate,
    input_price: row.inputPrice,
    output_price: row.outputPrice,
    avg_generation_price: row.avgGenerationPrice,
    announcement_date: row.announcementDate ?? '',
    license: row.license ?? '',
    is_open_source: row.isOpenSource,
  };
}

// Returns Record<arena, MagiaLeaderboardResponse> so the caller can look up
// each arena by name without a second grouping pass.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const arenas = searchParams.get('arenas')?.split(',').filter(Boolean) ?? [];

    if (arenas.length === 0) {
      return NextResponse.json({ error: 'Missing required parameter: arenas' }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(zevalArenaEntries)
      .where(
        arenas.length === 1
          ? eq(zevalArenaEntries.arena, arenas[0]!)
          : inArray(zevalArenaEntries.arena, arenas),
      );

    const grouped: Record<string, ReturnType<typeof toMagiaItem>[]> = {};
    for (const row of rows) {
      const bucket = grouped[row.arena] ?? [];
      bucket.push(toMagiaItem(row));
      grouped[row.arena] = bucket;
    }

    const result: Record<
      string,
      {
        leaderboard: ReturnType<typeof toMagiaItem>[];
        total_count: number;
        limit: number;
        offset: number;
      }
    > = {};
    for (const [arena, items] of Object.entries(grouped)) {
      result[arena] = {
        leaderboard: items,
        total_count: items.length,
        limit: items.length,
        offset: 0,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    logError('GET /api/arena-entries error', error);
    return NextResponse.json({ error: 'Failed to fetch arena entries' }, { status: 500 });
  }
}
