'use client';

import { Button } from '@lmring/ui';
import { CheckIcon, Handshake, ThumbsDown, ThumbsUp } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export interface VoteButtonProps {
  voteState: 'none' | 'winner' | 'loser' | 'tie' | 'all_bad';
  isVotable: boolean;
  isSubmitting: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const VoteButton = React.memo(function VoteButton({
  voteState,
  isVotable,
  isSubmitting,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: VoteButtonProps) {
  const { t } = useTranslation();

  if (voteState === 'winner') {
    return (
      <Button
        className="w-full h-11 bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
        disabled
      >
        <CheckIcon className="h-4 w-4 mr-1.5" />
        {t('Arena.vote_winner', 'Winner!')}
      </Button>
    );
  }

  if (voteState === 'loser') {
    return (
      <Button className="w-full h-11" variant="outline" disabled>
        {t('Arena.vote_not_selected', 'Not selected')}
      </Button>
    );
  }

  if (voteState === 'tie') {
    return (
      <Button
        className="w-full h-11 border-green-500 text-green-500 hover:bg-green-500/10"
        variant="outline"
        disabled
      >
        <Handshake className="h-4 w-4 mr-1.5" />
        {t('Arena.vote_tie_selected', "It's a tie")}
      </Button>
    );
  }

  if (voteState === 'all_bad') {
    return (
      <Button
        className="w-full h-11 border-red-500 text-red-500 hover:bg-red-500/10"
        variant="outline"
        disabled
      >
        <ThumbsDown className="h-4 w-4 mr-1.5" />
        {t('Arena.vote_all_bad_selected', 'All Bad')}
      </Button>
    );
  }

  // voteState === 'none'
  if (!isVotable) {
    return null;
  }

  return (
    <Button
      className="w-full h-11 transition-all duration-200"
      variant="default"
      disabled={isSubmitting}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ThumbsUp className="h-4 w-4 mr-1.5" />
      {t('Arena.vote_for_this', 'Vote for this')}
    </Button>
  );
});

VoteButton.displayName = 'VoteButton';
