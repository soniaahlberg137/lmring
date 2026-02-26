'use client';

import { Button, cn } from '@lmring/ui';
import { Handshake, ThumbsDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OPTION_COLORS } from '@/constants/webdev';
import type { SandboxStatus } from '@/types/webdev';
import { VoteChip } from './vote-chip';

export type WebDevVoteType = 'winner' | 'tie' | 'all_bad';

export interface WebDevVoteResult {
  voteType: WebDevVoteType;
  /** Index of the winning option (0-4), only set when voteType is 'winner' */
  winnerIndex?: number;
}

interface OptionEntry {
  workflowId: string;
  modelName: string;
  index: number;
  status: SandboxStatus;
}

interface WebDevVoteBarProps {
  options: OptionEntry[];
  onVote: (result: WebDevVoteResult) => Promise<boolean>;
  className?: string;
}

function isTerminalStatus(status: SandboxStatus): boolean {
  return status === 'ready' || status === 'error' || status === 'expired' || status === 'stopped';
}

export const WebDevVoteBar = React.memo(function WebDevVoteBar({
  options,
  onVote,
  className,
}: WebDevVoteBarProps) {
  const { t } = useTranslation();
  const [vote, setVote] = React.useState<WebDevVoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Only show when 2+ models and all have terminal status
  const isVotable =
    options.length >= 2 && options.every((o) => isTerminalStatus(o.status)) && !vote;

  const handleVote = React.useCallback(
    async (result: WebDevVoteResult) => {
      if (isSubmitting || vote) return;
      setIsSubmitting(true);

      const success = await onVote(result);

      if (success) {
        setVote(result);
        toast.success(t('Arena.vote_success'));
      } else {
        toast.error(t('Arena.vote_failed'));
      }

      setIsSubmitting(false);
    },
    [isSubmitting, vote, onVote, t],
  );

  const handleWinnerVote = React.useCallback(
    (index: number) => {
      handleVote({ voteType: 'winner', winnerIndex: index });
    },
    [handleVote],
  );

  const handleTieVote = React.useCallback(() => {
    handleVote({ voteType: 'tie' });
  }, [handleVote]);

  const handleAllBadVote = React.useCallback(() => {
    handleVote({ voteType: 'all_bad' });
  }, [handleVote]);

  // Get vote state for a specific option index
  const getVoteState = React.useCallback(
    (index: number): 'none' | 'winner' | 'loser' | 'tie' | 'all_bad' => {
      if (!vote) return 'none';
      if (vote.voteType === 'tie') return 'tie';
      if (vote.voteType === 'all_bad') return 'all_bad';
      return vote.winnerIndex === index ? 'winner' : 'loser';
    },
    [vote],
  );

  if (options.length < 2) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Vote prompt + option chips */}
      {isVotable && (
        <p className="text-xs text-muted-foreground text-center">{t('Arena.vote_prompt')}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {options.map((option) => (
          <VoteChip
            key={option.workflowId}
            index={option.index}
            state={getVoteState(option.index)}
            isVotable={isVotable}
            isSubmitting={isSubmitting}
            onClick={() => handleWinnerVote(option.index)}
          />
        ))}
      </div>

      {/* Tie / All Bad buttons */}
      {isVotable && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTieVote}
            disabled={isSubmitting}
            className="h-7 text-xs border-green-500/50 hover:bg-green-500/10 hover:border-green-500"
          >
            <Handshake className="h-3.5 w-3.5 mr-1 text-green-500" />
            {t('Arena.vote_tie')}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAllBadVote}
            disabled={isSubmitting}
            className="h-7 text-xs border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
          >
            <ThumbsDown className="h-3.5 w-3.5 mr-1 text-red-500" />
            {t('Arena.vote_all_bad')}
          </Button>
        </div>
      )}

      {/* Post-vote state */}
      {vote && vote.voteType === 'tie' && (
        <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
          {t('Arena.vote_tie_selected')}
        </p>
      )}
      {vote && vote.voteType === 'all_bad' && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
          {t('Arena.vote_all_bad_selected')}
        </p>
      )}
      {vote && vote.voteType === 'winner' && vote.winnerIndex != null && (
        <p
          className="text-xs text-center font-medium"
          style={{ color: OPTION_COLORS[vote.winnerIndex]?.bg }}
        >
          {t('Arena.vote_winner')}
        </p>
      )}
    </div>
  );
});
