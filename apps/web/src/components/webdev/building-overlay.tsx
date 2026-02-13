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
    <div className="absolute inset-0 z-10 flex h-full items-center justify-center bg-[#FAFAF9]">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="webdev-building-block h-10 w-[72px] rounded-lg bg-[#D4D4D8]" />
          <div className="webdev-building-block -mt-2 h-10 w-[88px] rounded-lg bg-[#A1A1AA]" />
          <div className="webdev-building-block -mt-2 h-10 w-[104px] rounded-lg bg-[#71717A]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[#1A1A1A]">Building...</p>
          <p className="mt-2 text-sm text-[#71717A]">
            Preview will appear when agent is done working
          </p>
        </div>
      </div>
    </div>
  );
}
