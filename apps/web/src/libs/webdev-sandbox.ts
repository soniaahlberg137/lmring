import type { Sandbox } from '@vercel/sandbox';

/**
 * Blocks until a process inside the sandbox is accepting connections on the
 * given port.
 *
 * `runCommand` with `detached: true` resolves as soon as the process is
 * spawned, before the dev server binds its port. Announcing the preview URL
 * at that point makes the iframe hit Vercel's edge while nothing is listening
 * yet, which surfaces as `502 SANDBOX_NOT_LISTENING`. Polling happens inside
 * the sandbox via a single bash loop: any HTTP response (curl exit 0) means
 * the port is bound, connection-refused keeps retrying every 500ms.
 *
 * Throws if the port is still not listening after `timeoutMs`.
 */
export async function waitForPortReady(
  sandbox: Sandbox,
  port: number,
  timeoutMs = 30_000,
): Promise<void> {
  const attempts = Math.max(1, Math.ceil(timeoutMs / 500));
  const result = await sandbox.runCommand({
    cmd: 'bash',
    args: [
      '-c',
      `for i in $(seq 1 ${attempts}); do curl -s -o /dev/null http://localhost:${port} && exit 0; sleep 0.5; done; exit 1`,
    ],
  });

  if (result.exitCode !== 0) {
    throw new Error(`Dev server is not listening on port ${port} after ${timeoutMs / 1000}s`);
  }
}
