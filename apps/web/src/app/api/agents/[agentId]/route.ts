import { db, eq } from '@lmring/database';
import { agents } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

export async function GET(_request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    logError('GET /api/agents/[agentId] error', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}
