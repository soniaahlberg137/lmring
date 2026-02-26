import { db, eq } from '@lmring/database';
import { webdevResponses } from '@lmring/database/schema';
import { APIError, Sandbox } from '@vercel/sandbox';
import { auth } from '@/libs/Auth';
import { logError } from '@/libs/error-logging';
import { getSandboxCredentials, getWebDevConfig } from '@/libs/webdev-config';
import { checkSandboxRateLimit } from '@/libs/webdev-resource-manager';
import { webdevSandboxCreateSchema } from '@/libs/webdev-validation';

const VITE_CONFIG_PATTERN = /(?:^|[\\/])vite\.config\.(js|ts|mjs|mts)$/;

/**
 * Ensures Vite config files have `server: { allowedHosts: true }` so the
 * preview iframe isn't blocked by Vite's DNS-rebinding protection.
 *
 * Mutates the files array in-place and returns it.
 */
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
      continue;
    }

    if (/defineConfig\s*\(\s*\{/.test(file.content)) {
      file.content = file.content.replace(
        /(defineConfig\s*\(\s*\{)/,
        '$1 server: { allowedHosts: true },',
      );
      continue;
    }

    if (/export\s+default\s*\{/.test(file.content)) {
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

    const webdevConfig = getWebDevConfig();
    if (!webdevConfig.enabled) {
      return new Response(
        JSON.stringify({
          error: 'WebDev sandbox is not configured',
          reason: webdevConfig.reason,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Enforce sandbox creation rate limit
    const rateLimit = await checkSandboxRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          sendEvent({ type: 'sandbox-creating', responseId });

          sandboxInstance = await Sandbox.create({
            ...getSandboxCredentials(),
            timeout: 5 * 60 * 1000,
            resources: { vcpus: 2 },
            ports: [5173],
          });

          const patchedFiles = patchViteAllowedHosts(
            files.map((f) => ({ path: f.path, content: f.content })),
          );
          await sandboxInstance.writeFiles(
            patchedFiles.map((f) => ({
              path: f.path,
              content: Buffer.from(f.content),
            })),
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
          const sandboxId = sandboxInstance.sandboxId;
          const timeoutMs = sandboxInstance.timeout;
          const expiresAt = timeoutMs > 0 ? new Date(Date.now() + timeoutMs).toISOString() : null;

          sendEvent({
            type: 'sandbox-ready',
            responseId,
            sandboxId,
            previewUrl,
            expiresAt,
          });

          sendEvent({ type: 'complete', responseId, sessionId });

          try {
            await db
              .update(webdevResponses)
              .set({
                sandboxId,
                previewUrl,
                status: 'ready',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                files: Object.fromEntries(files.map((f) => [f.path, f.content])),
              })
              .where(eq(webdevResponses.id, responseId));
          } catch (dbError) {
            logError('WebDev sandbox DB update failed', dbError, { responseId, sandboxId });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = extractSandboxError(error);
          sendEvent({
            type: 'error',
            responseId,
            message: errorMessage,
          });

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
    logError('WebDev sandbox creation error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
