import { and, db, eq } from '@lmring/database';
import type { ResponseAttachment } from '@lmring/database/schema';
import { conversations, messages, modelResponses } from '@lmring/database/schema';
import { createStorageService } from '@lmring/storage';
import { NextResponse } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { modelResponseSchema } from '@/libs/validation';

/**
 * Convert attachment storage keys to signed URLs
 * If an attachment already has an external URL (e.g., video URLs), use that directly
 */
async function attachmentsWithUrls(
  attachments: ResponseAttachment[] | null,
): Promise<Array<ResponseAttachment & { url: string }> | null> {
  if (!attachments || attachments.length === 0) return null;

  const storage = createStorageService();

  return Promise.all(
    attachments.map(async (att) => ({
      ...att,
      // If already has external URL, use it; otherwise generate from storage
      url: att.url || (await storage.createDownloadUrl(att.key)),
    })),
  );
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
    const rawBody = (await request.json()) as {
      messageId: string;
      modelName: string;
      providerName: string;
      responseContent: string;
      attachments?: Array<{
        type: 'image' | 'audio' | 'video';
        key: string;
        mimeType: string;
        filename?: string;
        sizeBytes?: number;
      }>;
      tokensUsed?: number;
      responseTimeMs?: number;
      displayPosition?: number;
    };

    const validationResult = modelResponseSchema.safeParse(rawBody);
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
        conversationId: messages.conversationId,
        userId: conversations.userId,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.id, body.messageId))
      .limit(1);

    if (!message || message.userId !== userId) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const [newResponse] = await db
      .insert(modelResponses)
      .values({
        messageId: body.messageId,
        modelName: body.modelName,
        providerName: body.providerName,
        responseContent: body.responseContent,
        attachments: body.attachments ?? null,
        tokensUsed: body.tokensUsed,
        responseTimeMs: body.responseTimeMs,
        displayPosition: body.displayPosition ?? 0,
      })
      .returning();

    return NextResponse.json({ response: newResponse }, { status: 201 });
  } catch (error) {
    logError('Create model response error', error);
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

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const responses = await db
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
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(modelResponses.messageId, messageId), eq(conversations.userId, userId)));

    // Convert storage keys to signed URLs
    const responsesWithUrls = await Promise.all(
      responses.map(async (response) => ({
        ...response,
        attachments: await attachmentsWithUrls(response.attachments as ResponseAttachment[] | null),
      })),
    );

    return NextResponse.json({ responses: responsesWithUrls }, { status: 200 });
  } catch (error) {
    logError('Get model responses error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
