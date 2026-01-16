import { and, asc, db, eq } from '@lmring/database';
import type { MessageAttachment, ResponseAttachment } from '@lmring/database/schema';
import { conversations, messages, modelResponses } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';

interface MessageWithResponses {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[] | null;
  createdAt: Date;
  responses?: Array<{
    id: string;
    modelName: string;
    providerName: string;
    responseContent: string;
    attachments?: ResponseAttachment[] | null;
    tokensUsed: number | null;
    responseTimeMs: number | null;
    displayPosition: number;
    createdAt: Date;
  }>;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: conversationId } = await params;

    // Get the conversation (security check)
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Parallelize messages and responses fetch for better performance
    // Both queries only depend on conversationId, not on each other
    const [conversationMessages, allResponses] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt)),
      db
        .select({
          id: modelResponses.id,
          messageId: modelResponses.messageId,
          modelName: modelResponses.modelName,
          providerName: modelResponses.providerName,
          responseContent: modelResponses.responseContent,
          attachments: modelResponses.attachments,
          tokensUsed: modelResponses.tokensUsed,
          responseTimeMs: modelResponses.responseTimeMs,
          displayPosition: modelResponses.displayPosition,
          createdAt: modelResponses.createdAt,
        })
        .from(modelResponses)
        .innerJoin(messages, eq(modelResponses.messageId, messages.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(modelResponses.displayPosition), asc(modelResponses.createdAt)),
    ]);

    // Build responses map from parallel-fetched data
    const responsesByMessageId: Map<
      string,
      Array<{
        id: string;
        modelName: string;
        providerName: string;
        responseContent: string;
        attachments?: ResponseAttachment[] | null;
        tokensUsed: number | null;
        responseTimeMs: number | null;
        displayPosition: number;
        createdAt: Date;
      }>
    > = new Map();

    for (const response of allResponses) {
      if (!responsesByMessageId.has(response.messageId)) {
        responsesByMessageId.set(response.messageId, []);
      }
      responsesByMessageId.get(response.messageId)?.push({
        id: response.id,
        modelName: response.modelName,
        providerName: response.providerName,
        responseContent: response.responseContent,
        attachments: response.attachments,
        tokensUsed: response.tokensUsed,
        responseTimeMs: response.responseTimeMs,
        displayPosition: response.displayPosition,
        createdAt: response.createdAt,
      });
    }

    // Build the result
    const messagesWithResponses: MessageWithResponses[] = conversationMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments,
      createdAt: msg.createdAt,
      responses: responsesByMessageId.get(msg.id),
    }));

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        messages: messagesWithResponses,
      },
      { status: 200 },
    );
  } catch (error) {
    logError('Get full conversation error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
