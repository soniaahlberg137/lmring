'use client';

import { Button, cn, Textarea } from '@lmring/ui';
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  const handleSubmit = React.useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading || disabled) return;
    onSubmit(trimmed);
  }, [prompt, isLoading, disabled, onSubmit]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isComposing],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: prompt changes should trigger height recalculation
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 120;
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [prompt]);

  const canSubmit = prompt.trim().length > 0 && !isLoading && !disabled;

  return (
    <div
      className={cn(
        'flex items-end gap-2 rounded-xl border border-[var(--webdev-border)] bg-[var(--webdev-input-bg)] p-2',
        className,
      )}
    >
      <Textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        disabled={isLoading || disabled}
        placeholder={placeholder}
        rows={1}
        className="min-h-[36px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0"
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'h-8 w-8 shrink-0 rounded-full transition-opacity',
          canSubmit ? 'opacity-100' : 'opacity-50',
        )}
      >
        <ArrowUp className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}
