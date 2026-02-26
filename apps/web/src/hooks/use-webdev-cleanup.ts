'use client';

import { useEffect, useRef } from 'react';
import { useWebDevStore } from '@/stores/webdev-store';

/** Heartbeat interval: ping every 4 minutes to extend sandbox timeout */
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000;

/**
 * Hook that manages sandbox lifecycle cleanup:
 *
 * 1. **beforeunload** — fires DELETE for all active sandboxes on page close/refresh
 * 2. **heartbeat** — periodically pings the server to extend sandbox timeouts
 * 3. **unmount cleanup** — destroys all sandboxes when navigating away from /webdev
 */
export function useWebDevCleanup() {
  const sandboxes = useWebDevStore((s) => s.sandboxes);
  const destroyAllSandboxes = useWebDevStore((s) => s.destroyAllSandboxes);

  // Refs to track latest values for handlers that must not cause re-subscriptions
  const sandboxesRef = useRef(sandboxes);
  sandboxesRef.current = sandboxes;

  const destroyAllRef = useRef(destroyAllSandboxes);
  destroyAllRef.current = destroyAllSandboxes;

  // ── beforeunload: fire-and-forget cleanup on page close ──
  useEffect(() => {
    function handleBeforeUnload() {
      const currentSandboxes = sandboxesRef.current;
      const sandboxIds: string[] = [];
      for (const [, sandbox] of currentSandboxes) {
        if (sandbox.sandboxId) {
          sandboxIds.push(sandbox.sandboxId);
        }
      }

      if (sandboxIds.length === 0) return;

      // Use sendBeacon with POST to the cleanup endpoint
      const sent = navigator.sendBeacon(
        '/api/webdev/sandbox/cleanup',
        new Blob([JSON.stringify({ sandboxIds })], {
          type: 'application/json',
        }),
      );

      if (!sent) {
        // Fallback: fetch with keepalive flag
        void fetch('/api/webdev/sandbox/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxIds }),
          keepalive: true,
        });
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Heartbeat: extend sandbox timeouts while user is active ──
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSandboxes = sandboxesRef.current;
      for (const [, sandbox] of currentSandboxes) {
        if (sandbox.sandboxId && sandbox.status === 'ready') {
          void fetch('/api/webdev/sandbox/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sandboxId: sandbox.sandboxId }),
          }).catch(() => {});
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // ── Unmount cleanup: destroy all sandboxes when leaving /webdev ──
  useEffect(() => {
    return () => {
      // Component unmount = navigating away from webdev page
      void destroyAllRef.current();
    };
  }, []);
}
