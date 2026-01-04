import { and, asc, db, desc, eq, inArray } from '@lmring/database';
import {
  comparisonVoteResults,
  comparisonVotes,
  conversations,
  messages,
  modelResponses,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { conversationSchema } from '@/libs/validation';

interface VoteInfo {
  hasVotes: boolean;
  winnerModel?: string;
  winnerProvider?: string;
  voteType?: 'winner' | 'tie' | 'all_bad';
}

interface ConversationWithExtras {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  firstMessage?: string;
  models?: Array<{ modelName: string; providerName: string }>;
  voteInfo?: VoteInfo;
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

    if (!withFirstMessage && !withModels && !withVotes) {
      return NextResponse.json({ conversations: userConversations }, { status: 200 });
    }

    const conversationIds = userConversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    const result: ConversationWithExtras[] = userConversations.map((c) => ({
      ...c,
    }));

    if (withFirstMessage) {
      const firstMessages = await db
        .select({
          conversationId: messages.conversationId,
          content: messages.content,
        })
        .from(messages)
        .where(and(inArray(messages.conversationId, conversationIds), eq(messages.role, 'user')))
        .orderBy(asc(messages.createdAt));

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

    if (withModels) {
      const modelsUsed = await db
        .selectDistinct({
          conversationId: messages.conversationId,
          modelName: modelResponses.modelName,
          providerName: modelResponses.providerName,
        })
        .from(modelResponses)
        .innerJoin(messages, eq(modelResponses.messageId, messages.id))
        .where(inArray(messages.conversationId, conversationIds));

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

    if (withVotes) {
      // Get all votes for messages in these conversations
      const votesData = await db
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
        );

      // Process votes - get the most recent vote per conversation with winner info
      const votesMap = new Map<string, VoteInfo>();
      for (const vote of votesData) {
        if (!votesMap.has(vote.conversationId)) {
          votesMap.set(vote.conversationId, { hasVotes: true });
        }
        const voteInfo = votesMap.get(vote.conversationId);
        if (voteInfo && vote.outcome === 'winner') {
          voteInfo.winnerModel = vote.modelName;
          voteInfo.winnerProvider = vote.providerName;
          voteInfo.voteType = 'winner';
        } else if (voteInfo && vote.outcome === 'tie' && !voteInfo.winnerModel) {
          voteInfo.voteType = 'tie';
        } else if (
          voteInfo &&
          vote.outcome === 'all_bad' &&
          !voteInfo.winnerModel &&
          voteInfo.voteType !== 'tie'
        ) {
          voteInfo.voteType = 'all_bad';
        }
      }

      for (const conv of result) {
        conv.voteInfo = votesMap.get(conv.id) || { hasVotes: false };
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
