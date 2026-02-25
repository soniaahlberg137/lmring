'use client';

import { cn } from '@lmring/ui';
import { ArrowUp } from 'lucide-react';
import * as React from 'react';
import { useWebDevStore } from '@/stores/webdev-store';

interface PromptBarProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PromptBar({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask a follow up...',
  className,
}: PromptBarProps) {
  const prompt = useWebDevStore((s) => s.prompt);
  const setPrompt = useWebDevStore((s) => s.setPrompt);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  const handleSubmit = React.useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading || disabled) return;
    onSubmit(trimmed);
  }, [prompt, isLoading, disabled, onSubmit]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isComposing && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isComposing],
  );

  const canSubmit = prompt.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 flex-1 items-center rounded-lg bg-[#F5F0EB] px-3.5">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={isLoading || disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#A1A1AA] outline-none"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'rounded-lg bg-[#1A1A1A] p-2.5 transition-opacity',
          canSubmit ? 'opacity-100' : 'opacity-50',
        )}
      >
        <ArrowUp className="h-[18px] w-[18px] text-white" />
        <span className="sr-only">Send</span>
      </button>
    </div>
  );
}
