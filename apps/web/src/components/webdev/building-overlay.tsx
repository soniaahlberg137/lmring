'use client';

/**
 * Building overlay — displayed over the preview area while a sandbox
 * is being created, installing deps, or starting the dev server.
 *
 * Uses the webdev-building-block / webdev-stack animation from webdev.css.
 * Respects prefers-reduced-motion via CSS media query.
 */
export function BuildingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--webdev-bg)]/90 backdrop-blur-sm">
      {/* Stacked blocks animation */}
      <div className="mb-6 flex flex-col items-center gap-1.5">
        <div
          className="webdev-building-block h-3 w-10 rounded-sm"
          style={{ backgroundColor: 'var(--webdev-status-generating)' }}
        />
        <div
          className="webdev-building-block h-3 w-10 rounded-sm"
          style={{ backgroundColor: 'var(--webdev-status-generating)', opacity: 0.7 }}
        />
        <div
          className="webdev-building-block h-3 w-10 rounded-sm"
          style={{ backgroundColor: 'var(--webdev-status-generating)', opacity: 0.4 }}
        />
      </div>

      <p className="text-sm font-medium text-foreground">Building your app&hellip;</p>
      <p className="mt-1 text-xs text-muted-foreground">This usually takes a moment</p>
    </div>
  );
}
