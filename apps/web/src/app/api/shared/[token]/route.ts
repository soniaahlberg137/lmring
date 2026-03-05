import { asc, db, desc, eq, inArray } from '@lmring/database';
import {
  comparisonVoteResults,
  comparisonVotes,
  conversations,
  messages,
  modelResponses,
  sharedResults,
  users,
  webdevIterations,
  webdevResponses,
  webdevSessions,
} from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';
import type { VoteInfo } from '@/types/vote';

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

    // Parallelize conversation and messages fetch for better performance
    const [conversationResult, conversationMessages] = await Promise.all([
      db
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
        .limit(1),
      db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, shared.conversationId))
        .orderBy(asc(messages.createdAt)),
    ]);

    const [conversationWithUser] = conversationResult;

    if (!conversationWithUser) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const userData = {
      name: conversationWithUser.userName,
      avatarUrl: conversationWithUser.userAvatarUrl,
    };

    const conversationData = {
      id: conversationWithUser.id,
      title: conversationWithUser.title,
      createdAt: conversationWithUser.createdAt,
    };

    // Check if this conversation has a webdev session
    const [webdevSession] = await db
      .select({
        id: webdevSessions.id,
        prompt: webdevSessions.prompt,
        status: webdevSessions.status,
      })
      .from(webdevSessions)
      .where(eq(webdevSessions.conversationId, shared.conversationId))
      .orderBy(desc(webdevSessions.createdAt))
      .limit(1);

    if (webdevSession) {
      // Fetch webdev responses and iterations in parallel
      const [wdResponses, wdIterations] = await Promise.all([
        db
          .select({
            id: webdevResponses.id,
            modelId: webdevResponses.modelId,
            files: webdevResponses.files,
            status: webdevResponses.status,
            displayPosition: webdevResponses.displayPosition,
            snapshotId: webdevResponses.snapshotId,
            snapshotExpiresAt: webdevResponses.snapshotExpiresAt,
            content: webdevResponses.content,
          })
          .from(webdevResponses)
          .where(eq(webdevResponses.sessionId, webdevSession.id))
          .orderBy(asc(webdevResponses.displayPosition)),
        db
          .select({
            id: webdevIterations.id,
            version: webdevIterations.version,
            prompt: webdevIterations.prompt,
            createdAt: webdevIterations.createdAt,
          })
          .from(webdevIterations)
          .where(eq(webdevIterations.sessionId, webdevSession.id))
          .orderBy(asc(webdevIterations.version)),
      ]);

      return NextResponse.json(
        {
          type: 'webdev' as const,
          conversation: conversationData,
          user: userData,
          session: webdevSession,
          responses: wdResponses,
          iterations: wdIterations,
        },
        { status: 200 },
      );
    }

    // Arena flow: fetch messages, model responses, and votes
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
        type: 'arena' as const,
        conversation: conversationData,
        user: userData,
        messages: messagesWithResponses,
      },
      { status: 200 },
    );
  } catch (error) {
    logError('Get shared result error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
