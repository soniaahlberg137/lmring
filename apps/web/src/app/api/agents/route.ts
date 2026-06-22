import { db, desc } from '@lmring/database';
import { agents } from '@lmring/database/schema';
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

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    logError('POST /api/agents error', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
