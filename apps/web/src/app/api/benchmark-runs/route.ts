import { and, db, eq, inArray } from '@lmring/database';
import { benchmarkRuns } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logError } from '@/libs/error-logging';

const callbackSchema = z.object({
  agentId: z.string().uuid(),
  benchmarkName: z.string().min(1),
  status: z.enum(['running', 'completed', 'failed']),
  halRunId: z.string().optional(),
  score: z.number().min(0).max(1).nullable().optional(),
  error: z.string().optional(),
  rawResults: z.record(z.string(), z.unknown()).optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
});

export async function POST(request: Request) {
  const secret = request.headers.get('x-sidecar-secret');
  if (!process.env.TESSERA_SIDECAR_SECRET || secret !== process.env.TESSERA_SIDECAR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = callbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const {
      agentId,
      benchmarkName,
      status,
      halRunId,
      score,
      error,
      rawResults,
      startedAt,
      completedAt,
    } = result.data;

    // Find the most recent non-final run for this agent+benchmark to update
    const [existing] = await db
      .select()
      .from(benchmarkRuns)
      .where(
        and(
          eq(benchmarkRuns.agentId, agentId),
          eq(benchmarkRuns.benchmarkName, benchmarkName),
          inArray(benchmarkRuns.status, ['pending', 'running']),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(benchmarkRuns)
        .set({
          status,
          halRunId: halRunId ?? existing.halRunId,
          score: score ?? null,
          error: error ?? null,
          rawResults: rawResults ?? null,
          startedAt: startedAt ? new Date(startedAt) : existing.startedAt,
          completedAt: completedAt ? new Date(completedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(benchmarkRuns.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    // No pending/running record — insert (handles out-of-order callbacks or manual retrigger)
    const [inserted] = await db
      .insert(benchmarkRuns)
      .values({
        agentId,
        benchmarkName,
        status,
        halRunId: halRunId ?? null,
        score: score ?? null,
        error: error ?? null,
        rawResults: rawResults ?? null,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      })
      .returning();
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    logError('POST /api/benchmark-runs error', err);
    return NextResponse.json({ error: 'Failed to record benchmark run' }, { status: 500 });
  }
}
