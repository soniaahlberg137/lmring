'use client';

import { cn } from '@lmring/ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OPTION_COLORS } from '@/constants/webdev';

type VoteChipState = 'none' | 'winner' | 'loser' | 'tie' | 'all_bad';

interface VoteChipProps {
  index: number;
  state: VoteChipState;
  isVotable: boolean;
  isSubmitting?: boolean;
  onClick?: () => void;
  className?: string;
}

export const VoteChip = React.memo(function VoteChip({
  index,
  state,
  isVotable,
  isSubmitting = false,
  onClick,
  className,
}: VoteChipProps) {
  const { t } = useTranslation();

  const color = OPTION_COLORS[index];
  if (!color) return null;

  const label = t('WebDev.option_is_better', { option: `Option ${color.key}` });

  if (state === 'winner') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
          'text-[11px] font-semibold text-white',
          className,
        )}
        style={{ backgroundColor: color.bg }}
      >
        {label}
      </span>
    );
  }

  if (state === 'loser' || state === 'tie' || state === 'all_bad') {
    return null;
  }

  // state === 'none'
  if (!isVotable) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
        'text-[11px] font-medium border transition-colors',
        'hover:text-white disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      style={
        {
          borderColor: color.bg,
          color: color.bg,
          '--chip-bg': color.bg,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = color.bg;
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = color.bg;
      }}
    >
      {label}
    </button>
  );
});
