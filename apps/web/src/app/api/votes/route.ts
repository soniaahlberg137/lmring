import { and, db, eq, sql } from '@lmring/database';
import {
  conversations,
  messages,
  modelRankings,
  modelResponses,
  userVotes,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { voteSchema } from '@/libs/validation';

async function updateModelRanking(modelName: string, providerName: string) {
  const votes = await db
    .select({
      voteType: userVotes.voteType,
      count: sql<number>`count(*)::int`,
    })
    .from(userVotes)
    .innerJoin(modelResponses, eq(userVotes.modelResponseId, modelResponses.id))
    .where(
      and(eq(modelResponses.modelName, modelName), eq(modelResponses.providerName, providerName)),
    )
    .groupBy(userVotes.voteType);

  let totalLikes = 0;
  let totalDislikes = 0;
  let totalNeutral = 0;

  for (const vote of votes) {
    if (vote.voteType === 'like') totalLikes = vote.count;
    else if (vote.voteType === 'dislike') totalDislikes = vote.count;
    else if (vote.voteType === 'neutral') totalNeutral = vote.count;
  }

  const totalVotes = totalLikes + totalDislikes + totalNeutral;
  const rankingScore = totalVotes > 0 ? (totalLikes / totalVotes) * 100 : 0;

  await db
    .insert(modelRankings)
    .values({
      modelName,
      providerName,
      totalLikes,
      totalDislikes,
      totalNeutral,
      rankingScore,
    })
    .onConflictDoUpdate({
      target: [modelRankings.modelName, modelRankings.providerName],
      set: {
        totalLikes,
        totalDislikes,
        totalNeutral,
        rankingScore,
        updatedAt: new Date(),
      },
    });
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rawBody = await request.json();

    const validationResult = voteSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    const [message] = await db
      .select({
        id: messages.id,
        userId: conversations.userId,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.id, body.messageId))
      .limit(1);

    if (!message || message.userId !== userId) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const [modelResponse] = await db
      .select()
      .from(modelResponses)
      .where(eq(modelResponses.id, body.modelResponseId))
      .limit(1);

    if (!modelResponse) {
      return NextResponse.json({ error: 'Model response not found' }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(userVotes)
      .where(and(eq(userVotes.userId, userId), eq(userVotes.modelResponseId, body.modelResponseId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userVotes)
        .set({
          voteType: body.voteType,
          updatedAt: new Date(),
        })
        .where(eq(userVotes.id, existing.id))
        .returning();

      // Update ranking (gracefully handles failures)
      try {
        await updateModelRanking(modelResponse.modelName, modelResponse.providerName);
      } catch (rankingError) {
        logError('Failed to update model ranking', rankingError);
      }

      return NextResponse.json({ vote: updated }, { status: 200 });
    }

    const [newVote] = await db
      .insert(userVotes)
      .values({
        userId,
        messageId: body.messageId,
        modelResponseId: body.modelResponseId,
        voteType: body.voteType,
      })
      .returning();

    // Update ranking (can fail gracefully - rankings can be recalculated)
    try {
      await updateModelRanking(modelResponse.modelName, modelResponse.providerName);
    } catch (rankingError) {
      logError('Failed to update model ranking', rankingError);
    }

    return NextResponse.json({ vote: newVote }, { status: 201 });
  } catch (error) {
    logError('Create/update vote error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    let whereCondition = eq(userVotes.userId, userId);
    if (messageId) {
      whereCondition =
        and(eq(userVotes.userId, userId), eq(userVotes.messageId, messageId)) ??
        eq(userVotes.userId, userId);
    }

    const votes = await db.select().from(userVotes).where(whereCondition);

    return NextResponse.json({ votes }, { status: 200 });
  } catch (error) {
    logError('Get votes error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const voteId = searchParams.get('id');

    if (!voteId) {
      return NextResponse.json({ error: 'Vote ID is required' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(userVotes)
      .where(and(eq(userVotes.id, voteId), eq(userVotes.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    const [modelResponse] = await db
      .select()
      .from(modelResponses)
      .where(eq(modelResponses.id, existing.modelResponseId))
      .limit(1);

    await db.delete(userVotes).where(eq(userVotes.id, voteId));

    // Update ranking (can fail gracefully - rankings can be recalculated)
    if (modelResponse) {
      try {
        await updateModelRanking(modelResponse.modelName, modelResponse.providerName);
      } catch (rankingError) {
        logError('Failed to update model ranking after delete', rankingError);
      }
    }

    return NextResponse.json({ message: 'Vote deleted successfully' }, { status: 200 });
  } catch (error) {
    logError('Delete vote error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
