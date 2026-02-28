'use client';

import { cn } from '@lmring/ui';
import { useTranslation } from 'react-i18next';

interface IterationEntry {
  version: number;
  prompt: string;
}

interface IterationTimelineProps {
  iterations: IterationEntry[];
  currentPrompt: string;
  currentVersion: number;
  activeVersion: number;
  onSelectVersion: (version: number) => void;
  disabled?: boolean;
}

export function IterationTimeline({
  iterations,
  currentPrompt,
  currentVersion,
  activeVersion,
  onSelectVersion,
  disabled = false,
}: IterationTimelineProps) {
  const { t } = useTranslation();

  // Build the full list: past iterations + current
  const allEntries: IterationEntry[] = [
    ...iterations,
    { version: currentVersion, prompt: currentPrompt },
  ];

  if (allEntries.length <= 1) {
    // Single iteration — show as a simple prompt card (no timeline needed)
    return (
      <div className="rounded-xl bg-[var(--webdev-bg)] p-4">
        <p className="text-xs font-medium text-[var(--webdev-text-muted)]">
          {t('WebDev.iteration_history')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--webdev-text)] line-clamp-3">
          {currentPrompt}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--webdev-bg)] p-3">
      <p className="mb-2 px-1 text-xs font-medium text-[var(--webdev-text-muted)]">
        {t('WebDev.iteration_history')}
      </p>
      <div className="flex flex-col gap-1">
        {allEntries.map((entry) => {
          const isCurrent = entry.version === currentVersion;
          const isActive = isCurrent
            ? activeVersion === 0 || activeVersion === currentVersion
            : entry.version === activeVersion;

          return (
            <button
              key={entry.version}
              type="button"
              disabled={disabled || isActive}
              onClick={() => onSelectVersion(isCurrent ? 0 : entry.version)}
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                isActive
                  ? 'bg-[var(--webdev-card-bg)] ring-1 ring-[var(--webdev-border)]'
                  : 'hover:bg-[var(--webdev-card-bg)]/50',
                disabled && !isActive && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t('WebDev.iteration_v', { version: entry.version })}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 text-xs leading-snug',
                  isActive ? 'text-[var(--webdev-text)]' : 'text-[var(--webdev-text-muted)]',
                )}
              >
                <span className="line-clamp-2">{entry.prompt}</span>
              </span>
              {isCurrent && (
                <span className="mt-0.5 shrink-0 text-[10px] font-medium text-primary">
                  {t('WebDev.iteration_current')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
