'use client';

import type { ComparisonType } from '@lmring/database';
import { Button, cn } from '@lmring/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Handshake, ThumbsDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useVoteStore } from '@/stores/vote-store';

interface ModelResponse {
  id: string;
  modelName: string;
  providerName: string;
}

interface VoteBarProps {
  messageId: string;
  modelResponses: ModelResponse[];
  comparisonType: ComparisonType;
  disabled?: boolean;
}

export const VoteBar = React.memo(function VoteBar({
  messageId,
  modelResponses,
  comparisonType,
  disabled = false,
}: VoteBarProps) {
  const { t } = useTranslation();
  const { getVote, setHoveredVote, submitVote, isSubmitting } = useVoteStore();

  const [showTieAnimation, setShowTieAnimation] = React.useState(false);
  const [showAllBadAnimation, setShowAllBadAnimation] = React.useState(false);

  const existingVote = getVote(messageId);
  const participantIds = modelResponses.map((r) => r.id);

  const handleVote = React.useCallback(
    async (voteType: 'winner' | 'tie' | 'all_bad', winnerId?: string) => {
      const result = await submitVote({
        messageId,
        voteType,
        winnerId,
        comparisonType,
        participantIds,
      });

      if (result) {
        toast.success(t('Arena.vote_success', 'Vote recorded'));
      } else {
        toast.error(t('Arena.vote_failed', 'Failed to record vote'));
      }
    },
    [submitVote, messageId, comparisonType, participantIds, t],
  );

  const handleTieClick = React.useCallback(() => {
    if (isSubmitting) return;
    setShowTieAnimation(true);
    handleVote('tie');
  }, [isSubmitting, handleVote]);

  const handleAllBadClick = React.useCallback(() => {
    if (isSubmitting) return;
    setShowAllBadAnimation(true);
    handleVote('all_bad');
  }, [isSubmitting, handleVote]);

  const handleTieHover = React.useCallback(() => {
    setHoveredVote({
      messageId,
      voteType: 'tie',
    });
  }, [setHoveredVote, messageId]);

  const handleAllBadHover = React.useCallback(() => {
    setHoveredVote({
      messageId,
      voteType: 'all_bad',
    });
  }, [setHoveredVote, messageId]);

  const handleHoverLeave = React.useCallback(() => {
    setHoveredVote(null);
  }, [setHoveredVote]);

  if (existingVote) {
    return null;
  }

  const isVotable = !disabled;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 py-1 transition-opacity duration-200',
        isVotable ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      <div className="relative flex items-center gap-3">
        <AnimatePresence>
          {showTieAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{
                duration: 0.6,
                type: 'spring',
                bounce: 0.4,
              }}
              onAnimationComplete={() => setShowTieAnimation(false)}
            >
              <Handshake className="h-16 w-16 text-green-500 drop-shadow-lg" />
            </motion.div>
          )}
          {showAllBadAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{
                duration: 0.6,
                type: 'spring',
                bounce: 0.4,
              }}
              onAnimationComplete={() => setShowAllBadAnimation(false)}
            >
              <ThumbsDown className="h-16 w-16 text-red-500 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="sm"
          variant="outline"
          onClick={handleTieClick}
          onMouseEnter={handleTieHover}
          onMouseLeave={handleHoverLeave}
          disabled={disabled || isSubmitting}
          className="h-8 border-green-500/50 hover:bg-green-500/10 hover:border-green-500"
        >
          <Handshake className="h-4 w-4 mr-1.5 text-green-500" />
          {t('Arena.vote_tie', 'Tie')}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAllBadClick}
          onMouseEnter={handleAllBadHover}
          onMouseLeave={handleHoverLeave}
          disabled={disabled || isSubmitting}
          className="h-8 border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
        >
          <ThumbsDown className="h-4 w-4 mr-1.5 text-red-500" />
          {t('Arena.vote_all_bad', 'All Bad')}
        </Button>
      </div>
    </div>
  );
});
