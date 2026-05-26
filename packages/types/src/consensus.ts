import type { Verdict } from './bounty';
import type { VerdictSubmission } from './resolver';

/** Consensus outcome for a bounty */
export interface ConsensusResult {
  bountyId: bigint;
  reached: boolean;
  verdict?: Verdict;
  firstSubmitter?: `0x${string}`;
  secondSubmitter?: `0x${string}`;
  reason?: string;
}

/** Settlement payout breakdown (MVP 60/40) */
export interface PayoutBreakdown {
  bountyId: bigint;
  firstSubmitter: `0x${string}`;
  secondSubmitter: `0x${string}`;
  firstAmount: bigint;
  secondAmount: bigint;
}

export type { VerdictSubmission };
