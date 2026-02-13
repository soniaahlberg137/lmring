'use client';

import { cn } from '@lmring/ui';

interface PromptCardProps {
  prompt: string;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  return (
    <div className={cn('rounded-xl bg-[#F5F0EB] p-4', className)}>
      <p className="text-xs font-medium text-[#71717A]">Your prompt</p>
      <p className="mt-2 text-sm leading-relaxed text-[#1A1A1A]">{prompt}</p>
    </div>
  );
}
