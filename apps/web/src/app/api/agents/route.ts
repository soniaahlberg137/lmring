import { db, desc } from '@lmring/database';
import { agents, benchmarkRuns } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';
import { agentSubmissionSchema } from '@/libs/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
    const offset = Number(searchParams.get('offset') ?? '0');

    const rows = await db
      .select()
      .from(agents)
      .orderBy(desc(agents.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows, limit, offset });
  } catch (error) {
    logError('GET /api/agents error', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = agentSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      description,
      baseModel,
      domain,
      systemPrompt,
      tools,
      memoryConfig,
      configContent,
    } = result.data;

    const [agent] = await db
      .insert(agents)
      .values({
        name,
        description,
        baseModel,
        domain: domain ?? 'general',
        systemPrompt,
        tools: tools ?? null,
        memoryConfig: memoryConfig ?? null,
        configContent: configContent ?? null,
        submittedBy: null,
      })
      .returning();

    if (!agent) {
      throw new Error('Insert returned no rows');
    }

    // HAL integration — runs after agent is saved; errors here don't fail the request
    try {
      const benchmarkName = process.env.HAL_DEFAULT_BENCHMARK ?? 'gaia';
      await db.insert(benchmarkRuns).values({
        agentId: agent.id,
        benchmarkName,
        status: 'pending',
      });

      const sidecarUrl = process.env.HAL_SIDECAR_URL;
      const sidecarSecret = process.env.TESSERA_SIDECAR_SECRET;
      if (sidecarUrl && sidecarSecret) {
        fetch(`${sidecarUrl}/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sidecar-secret': sidecarSecret,
          },
          body: JSON.stringify({
            agentId: agent.id,
            agentName: agent.name,
            baseModel: agent.baseModel,
            systemPrompt: agent.systemPrompt ?? null,
            tools: agent.tools ?? null,
            benchmark: benchmarkName,
          }),
        }).catch((err: Error) => {
          console.warn('[tessera] sidecar notification failed:', err.message);
        });
      }
    } catch (halError) {
      // Log but don't surface — agent was created successfully
      console.error('[tessera] HAL integration error (agent saved):', halError);
    }

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    logError('POST /api/agents error', error);
    const message =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'Failed to create agent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
