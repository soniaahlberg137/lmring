import { and, asc, db, desc, eq, inArray } from '@lmring/database';
import {
  comparisonVoteResults,
  comparisonVotes,
  conversations,
  messages,
  modelResponses,
  webdevSessions,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { conversationSchema } from '@/libs/validation';
import type { VoteInfoExtended, VoteResult } from '@/types/vote';

interface ConversationWithExtras {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  firstMessage?: string;
  models?: Array<{ modelName: string; providerName: string }>;
  voteInfo?: VoteInfoExtended;
  webdevSessionId?: string;
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
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const parsedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 50 : Math.min(parsedLimit, 100);
    const offset = Number.isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
    const withFirstMessage = searchParams.get('withFirstMessage') === 'true';
    const withModels = searchParams.get('withModels') === 'true';
    const withVotes = searchParams.get('withVotes') === 'true';

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    const conversationIds = userConversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    // Always look up webdev sessions for routing
    const webdevSessionRows = await db
      .select({
        conversationId: webdevSessions.conversationId,
        sessionId: webdevSessions.id,
      })
      .from(webdevSessions)
      .where(inArray(webdevSessions.conversationId, conversationIds))
      .orderBy(desc(webdevSessions.createdAt));

    const webdevMap = new Map<string, string>();
    for (const row of webdevSessionRows) {
      if (row.conversationId && !webdevMap.has(row.conversationId)) {
        webdevMap.set(row.conversationId, row.sessionId);
      }
    }

    if (!withFirstMessage && !withModels && !withVotes) {
      const convs = userConversations.map((c) => ({
        ...c,
        webdevSessionId: webdevMap.get(c.id),
      }));
      return NextResponse.json({ conversations: convs }, { status: 200 });
    }

    const result: ConversationWithExtras[] = userConversations.map((c) => ({
      ...c,
    }));

    // Parallelize conditional queries for better performance
    const [firstMessages, modelsUsed, votesData] = await Promise.all([
      withFirstMessage
        ? db
            .select({
              conversationId: messages.conversationId,
              content: messages.content,
            })
            .from(messages)
            .where(
              and(inArray(messages.conversationId, conversationIds), eq(messages.role, 'user')),
            )
            .orderBy(asc(messages.createdAt))
        : Promise.resolve([]),
      withModels
        ? db
            .select({
              conversationId: messages.conversationId,
              modelName: modelResponses.modelName,
              providerName: modelResponses.providerName,
            })
            .from(modelResponses)
            .innerJoin(messages, eq(modelResponses.messageId, messages.id))
            .where(inArray(messages.conversationId, conversationIds))
        : Promise.resolve([]),
      withVotes
        ? db
            .select({
              conversationId: messages.conversationId,
              voteId: comparisonVotes.id,
              outcome: comparisonVoteResults.outcome,
              modelName: comparisonVoteResults.modelName,
              providerName: comparisonVoteResults.providerName,
            })
            .from(comparisonVotes)
            .innerJoin(messages, eq(comparisonVotes.messageId, messages.id))
            .innerJoin(
              comparisonVoteResults,
              eq(comparisonVoteResults.comparisonVoteId, comparisonVotes.id),
            )
            .where(
              and(
                inArray(messages.conversationId, conversationIds),
                eq(comparisonVotes.userId, userId),
              ),
            )
        : Promise.resolve([]),
    ]);

    // Process first messages
    if (withFirstMessage && firstMessages.length > 0) {
      const firstMessageMap = new Map<string, string>();
      for (const msg of firstMessages) {
        if (!firstMessageMap.has(msg.conversationId)) {
          firstMessageMap.set(msg.conversationId, msg.content);
        }
      }

      for (const conv of result) {
        const firstMsg = firstMessageMap.get(conv.id);
        if (firstMsg) {
          conv.firstMessage = firstMsg;
        }
      }
    }

    // Process models used
    if (withModels && modelsUsed.length > 0) {
      const modelsMap = new Map<string, Array<{ modelName: string; providerName: string }>>();
      for (const model of modelsUsed) {
        if (!modelsMap.has(model.conversationId)) {
          modelsMap.set(model.conversationId, []);
        }
        modelsMap.get(model.conversationId)?.push({
          modelName: model.modelName,
          providerName: model.providerName,
        });
      }

      for (const conv of result) {
        conv.models = modelsMap.get(conv.id) || [];
      }
    }

    // Process votes
    if (withVotes && votesData.length > 0) {
      const votesMap = new Map<string, VoteInfoExtended>();
      for (const vote of votesData) {
        if (!votesMap.has(vote.conversationId)) {
          votesMap.set(vote.conversationId, { hasVotes: true, voteResults: [] });
        }
        const voteInfo = votesMap.get(vote.conversationId);
        if (voteInfo) {
          voteInfo.voteResults?.push({
            modelName: vote.modelName ?? '',
            providerName: vote.providerName ?? '',
            outcome: vote.outcome as VoteResult['outcome'],
          });

          if (vote.outcome === 'winner') {
            voteInfo.winnerModel = vote.modelName;
            voteInfo.winnerProvider = vote.providerName;
            voteInfo.voteType = 'winner';
          } else if (vote.outcome === 'tie' && !voteInfo.winnerModel) {
            voteInfo.voteType = 'tie';
          } else if (
            vote.outcome === 'all_bad' &&
            !voteInfo.winnerModel &&
            voteInfo.voteType !== 'tie'
          ) {
            voteInfo.voteType = 'all_bad';
          }
        }
      }

      for (const conv of result) {
        conv.voteInfo = votesMap.get(conv.id) || { hasVotes: false };
      }
    } else if (withVotes) {
      for (const conv of result) {
        conv.voteInfo = { hasVotes: false };
      }
    }

    // Apply webdev session mapping (already fetched above)
    for (const conv of result) {
      const sessionId = webdevMap.get(conv.id);
      if (sessionId) {
        conv.webdevSessionId = sessionId;
      }
    }

    return NextResponse.json({ conversations: result }, { status: 200 });
  } catch (error) {
    logError('Get conversations error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const rawBody = (await request.json()) as { title: string };

    const validationResult = conversationSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId,
        title: body.title,
      })
      .returning();

    return NextResponse.json({ conversation: newConversation }, { status: 201 });
  } catch (error) {
    logError('Create conversation error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
