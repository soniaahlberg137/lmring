'use client';

/**
 * Building overlay -- displayed over the preview area while a sandbox
 * is being created, installing deps, or starting the dev server.
 *
 * Uses stacked blocks animation from webdev.css.
 * Respects prefers-reduced-motion via CSS media query.
 */
export function BuildingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex h-full items-center justify-center bg-[var(--webdev-preview-bg)]">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="webdev-building-block h-10 w-[72px] rounded-lg bg-[var(--webdev-block-light)]" />
          <div className="webdev-building-block -mt-2 h-10 w-[88px] rounded-lg bg-[var(--webdev-block-mid)]" />
          <div className="webdev-building-block -mt-2 h-10 w-[104px] rounded-lg bg-[var(--webdev-block-dark)]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--webdev-text)]">Building...</p>
          <p className="mt-2 text-sm text-[var(--webdev-text-muted)]">
            Preview will appear when agent is done working
          </p>
        </div>
      </div>
    </div>
  );
}
