'use client';

import { cn } from '@lmring/ui';

interface PromptCardProps {
  prompt: string;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  return (
    <div className={cn('rounded-xl bg-[var(--webdev-bg)] p-4', className)}>
      <p className="text-xs font-medium text-[var(--webdev-text-muted)]">Your prompt</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--webdev-text)]">{prompt}</p>
    </div>
  );
}
