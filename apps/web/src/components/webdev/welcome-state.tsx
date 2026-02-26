'use client';

import { cn } from '@lmring/ui';
import { Code, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WelcomeStateProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

const EXAMPLE_ICONS = [Sparkles, Globe, Code] as const;

export function WelcomeState({ onSelectPrompt, className }: WelcomeStateProps) {
  const { t } = useTranslation();

  const examples = [
    t('WebDev.example_prompt_1'),
    t('WebDev.example_prompt_2'),
    t('WebDev.example_prompt_3'),
  ];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6 p-8', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t('WebDev.welcome_title')}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{t('WebDev.welcome_description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {EXAMPLE_ICONS.map((Icon, index) => {
          const prompt = examples[index] ?? '';
          return (
            <button
              key={`${index}-${prompt}`}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className={cn(
                'flex items-start gap-3 rounded-xl p-4 text-left',
                'bg-[var(--webdev-bg)] border border-[var(--webdev-border)]',
                'hover:border-[var(--webdev-accent)] hover:bg-[var(--webdev-bg-hover)]',
                'transition-colors duration-150 cursor-pointer',
              )}
            >
              <Icon className="size-4 mt-0.5 shrink-0 text-[var(--webdev-accent)]" />
              <span className="text-sm leading-relaxed">{prompt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
