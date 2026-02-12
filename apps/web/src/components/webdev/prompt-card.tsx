'use client';

import { cn } from '@lmring/ui';

interface PromptCardProps {
  prompt: string;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[var(--webdev-bg)] p-4',
        'border border-[var(--webdev-border)]',
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">Your prompt</p>
      <p className="text-sm leading-relaxed">{prompt}</p>
    </div>
  );
}
