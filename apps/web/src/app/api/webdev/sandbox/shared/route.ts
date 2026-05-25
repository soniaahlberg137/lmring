import { and, db, eq } from '@lmring/database';
import { sharedResults, webdevResponses, webdevSessions } from '@lmring/database/schema';
import { APIError, Sandbox } from '@vercel/sandbox';
import { nanoid } from 'nanoid';
import { logError } from '@/libs/error-logging';
import { getSandboxCredentials, getWebDevConfig } from '@/libs/webdev-config';
import { webdevSharedSandboxSchema } from '@/libs/webdev-validation';

const MAX_SHARED_SANDBOX_PER_IP_PER_DAY = 10;
const VITE_CONFIG_PATTERN = /(?:^|[\\/])vite\.config\.(js|ts|mjs|mts)$/;

function generateSandboxName(): string {
  return `webdev-shared-${nanoid(16)}`;
}

const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: MAX_SHARED_SANDBOX_PER_IP_PER_DAY - 1 };
  }

  if (entry.count >= MAX_SHARED_SANDBOX_PER_IP_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_SHARED_SANDBOX_PER_IP_PER_DAY - entry.count };
}

function patchViteAllowedHosts(
  files: { path: string; content: string }[],
): { path: string; content: string }[] {
  let viteConfigFound = false;

  for (const file of files) {
    if (!VITE_CONFIG_PATTERN.test(file.path)) continue;
    viteConfigFound = true;
    if (file.content.includes('allowedHosts')) continue;

    if (/server\s*:\s*\{/.test(file.content)) {
      file.content = file.content.replace(/(server\s*:\s*\{)/, '$1 allowedHosts: true,');
    } else if (/defineConfig\s*\(\s*\{/.test(file.content)) {
      file.content = file.content.replace(
        /(defineConfig\s*\(\s*\{)/,
        '$1 server: { allowedHosts: true },',
      );
    } else if (/export\s+default\s*\{/.test(file.content)) {
      file.content = file.content.replace(
        /(export\s+default\s*\{)/,
        '$1 server: { allowedHosts: true },',
      );
    }
  }

  if (!viteConfigFound) {
    const pkg = files.find((f) => f.path === 'package.json' || f.path === './package.json');
    if (pkg) {
      try {
        const parsed = JSON.parse(pkg.content);
        const deps = { ...parsed.dependencies, ...parsed.devDependencies };
        if (deps.vite) {
          files.push({
            path: 'vite.config.js',
            content: [
              "import { defineConfig } from 'vite';",
              'export default defineConfig({ server: { allowedHosts: true } });',
              '',
            ].join('\n'),
          });
        }
      } catch {}
    }
  }

  return files;
}

function extractSandboxError(error: unknown): string {
  if (error instanceof APIError) {
    const parts: string[] = [`Sandbox API error (status ${error.response?.status ?? 'unknown'})`];
    if (error.json) {
      try {
        parts.push(JSON.stringify(error.json));
      } catch {}
    } else if (error.text) {
      parts.push(error.text);
    } else {
      parts.push(error.message);
    }
    return parts.join(': ');
  }
  return error instanceof Error ? error.message : 'Sandbox creation failed';
}

/**
 * POST /api/webdev/sandbox/shared
 *
 * Creates a Vercel Sandbox for a shared webdev session (no auth required).
 * Validates the share token and builds a sandbox from stored files.
 */
export async function POST(request: Request) {
  let sandboxInstance: Sandbox | null = null;

  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimit = checkIpRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', remaining: 0 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await request.json();
    const validationResult = webdevSharedSandboxSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { shareToken, responseId, snapshotId } = validationResult.data;

    // Validate share token
    const [shared] = await db
      .select()
      .from(sharedResults)
      .where(eq(sharedResults.shareToken, shareToken))
      .limit(1);

    if (!shared) {
      return new Response(JSON.stringify({ error: 'Invalid share token' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (shared.expiresAt && new Date() > shared.expiresAt) {
      return new Response(JSON.stringify({ error: 'Share link has expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate responseId belongs to a webdev session linked to this conversation
    const [webdevSession] = await db
      .select({ id: webdevSessions.id })
      .from(webdevSessions)
      .where(eq(webdevSessions.conversationId, shared.conversationId))
      .limit(1);

    if (!webdevSession) {
      return new Response(JSON.stringify({ error: 'Not a webdev conversation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [response] = await db
      .select({ id: webdevResponses.id, files: webdevResponses.files })
      .from(webdevResponses)
      .where(
        and(eq(webdevResponses.id, responseId), eq(webdevResponses.sessionId, webdevSession.id)),
      )
      .limit(1);

    if (!response?.files) {
      return new Response(JSON.stringify({ error: 'Response not found or has no files' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const webdevConfig = getWebDevConfig();
    if (!webdevConfig.enabled) {
      return new Response(
        JSON.stringify({ error: 'WebDev sandbox is not configured', reason: webdevConfig.reason }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const files = Object.entries(response.files as Record<string, string>).map(
      ([path, content]) => ({ path, content }),
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          // Try snapshot restore first
          if (snapshotId) {
            try {
              sendEvent({ type: 'sandbox-creating', responseId });

              sandboxInstance = await Sandbox.create({
                ...getSandboxCredentials(),
                name: generateSandboxName(),
                source: { type: 'snapshot', snapshotId },
                timeout: 5 * 60 * 1000,
                ports: [5173],
              });

              sendEvent({ type: 'sandbox-starting', responseId });

              await sandboxInstance.runCommand({
                cmd: 'npm',
                args: ['run', 'dev'],
                detached: true,
              });

              const previewUrl = sandboxInstance.domain(5173);

              sendEvent({
                type: 'sandbox-ready',
                responseId,
                sandboxId: sandboxInstance.name,
                previewUrl,
              });

              sendEvent({ type: 'complete', responseId });
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            } catch (snapshotError) {
              logError('Shared sandbox snapshot restore failed, rebuilding', snapshotError, {
                responseId,
                snapshotId,
              });
            }
          }

          // Full rebuild from files
          sendEvent({ type: 'sandbox-creating', responseId });

          sandboxInstance = await Sandbox.create({
            ...getSandboxCredentials(),
            name: generateSandboxName(),
            timeout: 5 * 60 * 1000,
            resources: { vcpus: 2 },
            ports: [5173],
          });

          const patchedFiles = patchViteAllowedHosts(
            files.map((f) => ({ path: f.path, content: f.content })),
          );
          await sandboxInstance.writeFiles(
            patchedFiles.map((f) => ({ path: f.path, content: Buffer.from(f.content) })),
          );

          sendEvent({ type: 'sandbox-installing', responseId });

          const installResult = await sandboxInstance.runCommand('npm', ['install']);
          if (installResult.exitCode !== 0) {
            const stderr = await installResult.stderr();
            throw new Error(`npm install failed (exit ${installResult.exitCode}): ${stderr}`);
          }

          sendEvent({ type: 'sandbox-starting', responseId });

          await sandboxInstance.runCommand({
            cmd: 'npm',
            args: ['run', 'dev'],
            detached: true,
          });

          const previewUrl = sandboxInstance.domain(5173);

          sendEvent({
            type: 'sandbox-ready',
            responseId,
            sandboxId: sandboxInstance.name,
            previewUrl,
          });

          sendEvent({ type: 'complete', responseId });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          sendEvent({ type: 'error', responseId, message: extractSandboxError(error) });
          controller.close();

          if (sandboxInstance) {
            try {
              await sandboxInstance.stop();
            } catch {}
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
    logError('Shared sandbox creation error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
