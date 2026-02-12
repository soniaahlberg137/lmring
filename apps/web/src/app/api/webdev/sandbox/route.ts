import { db, eq } from '@lmring/database';
import { webdevResponses } from '@lmring/database/schema';
import { Sandbox } from '@vercel/sandbox';
import { after } from 'next/server';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { webdevSandboxCreateSchema } from '@/libs/webdev-validation';

/**
 * POST /api/webdev/sandbox
 *
 * Creates a Vercel Sandbox from generated files and streams progress via SSE.
 * The client sends a list of files (from AI code generation) and this endpoint:
 * 1. Creates a sandbox MicroVM
 * 2. Writes the files into the sandbox
 * 3. Runs `npm install`
 * 4. Starts `npm run dev` (detached)
 * 5. Streams the preview URL back
 *
 * SSE events: sandbox-creating → sandbox-installing → sandbox-starting → sandbox-ready | error
 */
export async function POST(request: Request) {
  let sandboxInstance: Sandbox | null = null;

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await request.json();
    const validationResult = webdevSandboxCreateSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { files, sessionId, responseId } = validationResult.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          // Phase 1: Create sandbox
          sendEvent({ type: 'sandbox-creating', responseId });

          sandboxInstance = await Sandbox.create({
            timeout: 5 * 60 * 1000,
            resources: { vcpus: 1 },
            ports: [5173],
          });

          // Phase 2: Write files into sandbox
          await sandboxInstance.writeFiles(
            files.map((f) => ({
              path: f.path,
              content: Buffer.from(f.content),
            })),
          );

          // Phase 3: Install dependencies
          sendEvent({ type: 'sandbox-installing', responseId });

          const installResult = await sandboxInstance.runCommand('npm', ['install']);
          if (installResult.exitCode !== 0) {
            const stderr = await installResult.stderr();
            throw new Error(`npm install failed (exit ${installResult.exitCode}): ${stderr}`);
          }

          // Phase 4: Start dev server (detached — non-blocking)
          sendEvent({ type: 'sandbox-starting', responseId });

          await sandboxInstance.runCommand({
            cmd: 'npm',
            args: ['run', 'dev'],
            detached: true,
          });

          // Get preview URL — sandbox.domain() is synchronous
          const previewUrl = sandboxInstance.domain(5173);
          const sandboxId = sandboxInstance.sandboxId;
          const timeoutMs = sandboxInstance.timeout;
          const expiresAt = timeoutMs > 0 ? new Date(Date.now() + timeoutMs).toISOString() : null;

          // Phase 5: Ready
          sendEvent({
            type: 'sandbox-ready',
            responseId,
            sandboxId,
            previewUrl,
            expiresAt,
          });

          sendEvent({ type: 'complete', responseId, sessionId });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          // Persist sandbox info to DB non-blocking (after response is sent)
          after(async () => {
            try {
              await db
                .update(webdevResponses)
                .set({
                  sandboxId,
                  previewUrl,
                  status: 'ready',
                  expiresAt: expiresAt ? new Date(expiresAt) : null,
                })
                .where(eq(webdevResponses.id, responseId));
            } catch (dbError) {
              logError('WebDev sandbox DB update failed', dbError, { responseId, sandboxId });
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sandbox creation failed';
          sendEvent({
            type: 'error',
            responseId,
            message: errorMessage,
          });
          controller.close();

          // Persist error status to DB non-blocking
          after(async () => {
            try {
              await db
                .update(webdevResponses)
                .set({
                  status: 'error',
                  error: errorMessage,
                })
                .where(eq(webdevResponses.id, responseId));
            } catch (dbError) {
              logError('WebDev sandbox error DB update failed', dbError, { responseId });
            }
          });

          // Attempt to clean up the sandbox on failure
          if (sandboxInstance) {
            try {
              await sandboxInstance.stop();
            } catch {
              // Ignore stop errors during cleanup
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logError('WebDev sandbox creation error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
