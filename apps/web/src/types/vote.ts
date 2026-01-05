import type { VoteOutcome } from '@lmring/database';

/**
 * Result of a vote for a specific model in a comparison
 */
export interface VoteResult {
  modelName: string;
  providerName: string;
  outcome: VoteOutcome;
}

/**
 * Basic vote information for shared conversations
 */
export interface VoteInfo {
  voteType?: 'winner' | 'tie' | 'all_bad';
  voteResults?: VoteResult[];
}

/**
 * Extended vote information with winner tracking for conversation listings
 */
export interface VoteInfoExtended extends VoteInfo {
  hasVotes: boolean;
  winnerModel?: string;
  winnerProvider?: string;
}
