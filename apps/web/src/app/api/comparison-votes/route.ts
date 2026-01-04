import { and, db, eq, inArray, sql } from '@lmring/database';
import {
  type ComparisonType,
  comparisonVoteResults,
  comparisonVotes,
  conversations,
  messages,
  modelComparisonStats,
  modelResponses,
  type VoteOutcome,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { comparisonVoteSchema } from '@/libs/validation';

/**
 * Update model comparison statistics after a vote
 */
async function updateModelComparisonStats(
  modelName: string,
  providerName: string,
  comparisonType: ComparisonType,
) {
  // Count outcomes for this model in this comparison type
  const outcomes = await db
    .select({
      outcome: comparisonVoteResults.outcome,
      count: sql<number>`count(*)::int`,
    })
    .from(comparisonVoteResults)
    .innerJoin(comparisonVotes, eq(comparisonVoteResults.comparisonVoteId, comparisonVotes.id))
    .where(
      and(
        eq(comparisonVoteResults.modelName, modelName),
        eq(comparisonVoteResults.providerName, providerName),
        eq(comparisonVotes.comparisonType, comparisonType),
      ),
    )
    .groupBy(comparisonVoteResults.outcome);

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let allBadCount = 0;

  for (const outcome of outcomes) {
    switch (outcome.outcome) {
      case 'winner':
        wins = outcome.count;
        break;
      case 'loser':
        losses = outcome.count;
        break;
      case 'tie':
        ties = outcome.count;
        break;
      case 'all_bad':
        allBadCount = outcome.count;
        break;
    }
  }

  const totalComparisons = wins + losses + ties + allBadCount;
  const winRate = totalComparisons > 0 ? (wins / totalComparisons) * 100 : 0;

  await db
    .insert(modelComparisonStats)
    .values({
      modelName,
      providerName,
      comparisonType,
      totalComparisons,
      wins,
      losses,
      ties,
      allBadCount,
      winRate,
    })
    .onConflictDoUpdate({
      target: [
        modelComparisonStats.modelName,
        modelComparisonStats.providerName,
        modelComparisonStats.comparisonType,
      ],
      set: {
        totalComparisons,
        wins,
        losses,
        ties,
        allBadCount,
        winRate,
        updatedAt: new Date(),
      },
    });
}

/**
 * POST - Create or update a comparison vote
 */
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

    const validationResult = comparisonVoteSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    // Verify message belongs to user
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

    // Verify all participant model responses exist and belong to this message
    const participantResponses = await db
      .select()
      .from(modelResponses)
      .where(
        and(
          inArray(modelResponses.id, body.participantIds),
          eq(modelResponses.messageId, body.messageId),
        ),
      );

    if (participantResponses.length !== body.participantIds.length) {
      return NextResponse.json(
        { error: 'Some model responses not found or do not belong to this message' },
        { status: 400 },
      );
    }

    // Check for existing vote on this message
    const [existingVote] = await db
      .select()
      .from(comparisonVotes)
      .where(and(eq(comparisonVotes.userId, userId), eq(comparisonVotes.messageId, body.messageId)))
      .limit(1);

    // If vote exists, delete old results first
    if (existingVote) {
      await db
        .delete(comparisonVoteResults)
        .where(eq(comparisonVoteResults.comparisonVoteId, existingVote.id));
      await db.delete(comparisonVotes).where(eq(comparisonVotes.id, existingVote.id));
    }

    // Create new comparison vote
    const [newVote] = await db
      .insert(comparisonVotes)
      .values({
        userId,
        messageId: body.messageId,
        comparisonType: body.comparisonType,
      })
      .returning();

    if (!newVote) {
      return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 });
    }

    // Determine outcome for each participant
    const results: Array<{
      comparisonVoteId: string;
      modelResponseId: string;
      modelName: string;
      providerName: string;
      outcome: VoteOutcome;
    }> = [];

    for (const response of participantResponses) {
      let outcome: VoteOutcome;

      if (body.voteType === 'winner') {
        outcome = response.id === body.winnerId ? 'winner' : 'loser';
      } else if (body.voteType === 'tie') {
        outcome = 'tie';
      } else {
        // all_bad
        outcome = 'all_bad';
      }

      results.push({
        comparisonVoteId: newVote.id,
        modelResponseId: response.id,
        modelName: response.modelName,
        providerName: response.providerName,
        outcome,
      });
    }

    // Insert all results
    const insertedResults = await db.insert(comparisonVoteResults).values(results).returning();

    // Update stats for each model
    const updatePromises = participantResponses.map((response) =>
      updateModelComparisonStats(response.modelName, response.providerName, body.comparisonType),
    );
    await Promise.all(updatePromises);

    return NextResponse.json(
      {
        vote: {
          id: newVote.id,
          messageId: newVote.messageId,
          comparisonType: newVote.comparisonType,
          voteType: body.voteType,
          winnerId: body.winnerId,
          results: insertedResults.map((r) => ({
            modelResponseId: r.modelResponseId,
            modelName: r.modelName,
            providerName: r.providerName,
            outcome: r.outcome,
          })),
        },
      },
      { status: existingVote ? 200 : 201 },
    );
  } catch (error) {
    logError('Create comparison vote error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get comparison vote for a message
 */
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

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    // Get the comparison vote
    const [vote] = await db
      .select()
      .from(comparisonVotes)
      .where(and(eq(comparisonVotes.userId, userId), eq(comparisonVotes.messageId, messageId)))
      .limit(1);

    if (!vote) {
      return NextResponse.json({ vote: null }, { status: 200 });
    }

    // Get the results
    const results = await db
      .select()
      .from(comparisonVoteResults)
      .where(eq(comparisonVoteResults.comparisonVoteId, vote.id));

    // Determine vote type and winner from results
    let voteType: 'winner' | 'tie' | 'all_bad' = 'tie';
    let winnerId: string | undefined;

    const firstResult = results[0];
    if (firstResult) {
      const firstOutcome = firstResult.outcome;
      if (firstOutcome === 'winner' || firstOutcome === 'loser') {
        voteType = 'winner';
        winnerId = results.find((r) => r.outcome === 'winner')?.modelResponseId;
      } else if (firstOutcome === 'all_bad') {
        voteType = 'all_bad';
      } else {
        voteType = 'tie';
      }
    }

    return NextResponse.json(
      {
        vote: {
          id: vote.id,
          messageId: vote.messageId,
          comparisonType: vote.comparisonType,
          voteType,
          winnerId,
          results: results.map((r) => ({
            modelResponseId: r.modelResponseId,
            modelName: r.modelName,
            providerName: r.providerName,
            outcome: r.outcome,
          })),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logError('Get comparison vote error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete a comparison vote
 */
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
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    // Find the vote
    const [existingVote] = await db
      .select()
      .from(comparisonVotes)
      .where(and(eq(comparisonVotes.userId, userId), eq(comparisonVotes.messageId, messageId)))
      .limit(1);

    if (!existingVote) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    // Get results to update stats after deletion
    const results = await db
      .select()
      .from(comparisonVoteResults)
      .where(eq(comparisonVoteResults.comparisonVoteId, existingVote.id));

    // Delete the vote (results will cascade delete)
    await db.delete(comparisonVotes).where(eq(comparisonVotes.id, existingVote.id));

    // Update stats for affected models
    const updatePromises = results.map((result) =>
      updateModelComparisonStats(
        result.modelName,
        result.providerName,
        existingVote.comparisonType,
      ),
    );
    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Vote deleted successfully' }, { status: 200 });
  } catch (error) {
    logError('Delete comparison vote error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
