import { asc, db, eq, inArray } from '@lmring/database';
import {
  comparisonVoteResults,
  comparisonVotes,
  conversations,
  messages,
  modelResponses,
  sharedResults,
  users,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

interface VoteResult {
  modelName: string;
  providerName: string;
  outcome: 'winner' | 'loser' | 'tie' | 'all_bad';
}

interface VoteInfo {
  voteType?: 'winner' | 'tie' | 'all_bad';
  voteResults?: VoteResult[];
}

interface MessageWithResponses {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  responses?: Array<{
    id: string;
    modelName: string;
    providerName: string;
    responseContent: string;
    tokensUsed: number | null;
    responseTimeMs: number | null;
    displayPosition: number;
    createdAt: Date;
  }>;
  voteInfo?: VoteInfo;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token: shareToken } = await params;

    const [shared] = await db
      .select()
      .from(sharedResults)
      .where(eq(sharedResults.shareToken, shareToken))
      .limit(1);

    if (!shared) {
      return NextResponse.json({ error: 'Shared result not found' }, { status: 404 });
    }

    if (shared.expiresAt && new Date() > shared.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const [conversationWithUser] = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
        userId: conversations.userId,
        userName: users.fullName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id))
      .where(eq(conversations.id, shared.conversationId))
      .limit(1);

    if (!conversationWithUser) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, shared.conversationId))
      .orderBy(asc(messages.createdAt));

    const messageIds = conversationMessages.map((m) => m.id);

    const responsesByMessageId: Map<
      string,
      Array<{
        id: string;
        modelName: string;
        providerName: string;
        responseContent: string;
        tokensUsed: number | null;
        responseTimeMs: number | null;
        displayPosition: number;
        createdAt: Date;
      }>
    > = new Map();

    if (messageIds.length === 1 && messageIds[0]) {
      const firstMessageId = messageIds[0];
      const responses = await db
        .select({
          id: modelResponses.id,
          messageId: modelResponses.messageId,
          modelName: modelResponses.modelName,
          providerName: modelResponses.providerName,
          responseContent: modelResponses.responseContent,
          tokensUsed: modelResponses.tokensUsed,
          responseTimeMs: modelResponses.responseTimeMs,
          displayPosition: modelResponses.displayPosition,
          createdAt: modelResponses.createdAt,
        })
        .from(modelResponses)
        .where(eq(modelResponses.messageId, firstMessageId))
        .orderBy(asc(modelResponses.displayPosition), asc(modelResponses.createdAt));

      responsesByMessageId.set(firstMessageId, responses);
    } else if (messageIds.length > 1) {
      const allResponses = await db
        .select({
          id: modelResponses.id,
          messageId: modelResponses.messageId,
          modelName: modelResponses.modelName,
          providerName: modelResponses.providerName,
          responseContent: modelResponses.responseContent,
          tokensUsed: modelResponses.tokensUsed,
          responseTimeMs: modelResponses.responseTimeMs,
          displayPosition: modelResponses.displayPosition,
          createdAt: modelResponses.createdAt,
        })
        .from(modelResponses)
        .innerJoin(messages, eq(modelResponses.messageId, messages.id))
        .where(eq(messages.conversationId, shared.conversationId))
        .orderBy(asc(modelResponses.displayPosition), asc(modelResponses.createdAt));

      for (const response of allResponses) {
        if (!responsesByMessageId.has(response.messageId)) {
          responsesByMessageId.set(response.messageId, []);
        }
        responsesByMessageId.get(response.messageId)?.push({
          id: response.id,
          modelName: response.modelName,
          providerName: response.providerName,
          responseContent: response.responseContent,
          tokensUsed: response.tokensUsed,
          responseTimeMs: response.responseTimeMs,
          displayPosition: response.displayPosition,
          createdAt: response.createdAt,
        });
      }
    }

    const votesByMessageId: Map<string, VoteInfo> = new Map();
    if (messageIds.length > 0) {
      const votesWithResults = await db
        .select({
          messageId: comparisonVotes.messageId,
          comparisonType: comparisonVotes.comparisonType,
          modelName: comparisonVoteResults.modelName,
          providerName: comparisonVoteResults.providerName,
          outcome: comparisonVoteResults.outcome,
        })
        .from(comparisonVotes)
        .innerJoin(
          comparisonVoteResults,
          eq(comparisonVoteResults.comparisonVoteId, comparisonVotes.id),
        )
        .where(inArray(comparisonVotes.messageId, messageIds));

      for (const voteRow of votesWithResults) {
        if (!votesByMessageId.has(voteRow.messageId)) {
          votesByMessageId.set(voteRow.messageId, {
            voteType: voteRow.comparisonType as 'winner' | 'tie' | 'all_bad',
            voteResults: [],
          });
        }
        votesByMessageId.get(voteRow.messageId)?.voteResults?.push({
          modelName: voteRow.modelName,
          providerName: voteRow.providerName,
          outcome: voteRow.outcome as 'winner' | 'loser' | 'tie' | 'all_bad',
        });
      }
    }

    const messagesWithResponses: MessageWithResponses[] = conversationMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      responses: responsesByMessageId.get(msg.id),
      voteInfo: votesByMessageId.get(msg.id),
    }));

    return NextResponse.json(
      {
        conversation: {
          id: conversationWithUser.id,
          title: conversationWithUser.title,
          createdAt: conversationWithUser.createdAt,
        },
        user: {
          name: conversationWithUser.userName,
          avatarUrl: conversationWithUser.userAvatarUrl,
        },
        messages: messagesWithResponses,
      },
      { status: 200 },
    );
  } catch (error) {
    logError('Get shared result error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
