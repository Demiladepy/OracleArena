/** Consensus lifecycle status — matches ConsensusEngine.ConsensusStatus */
export enum ConsensusStatus {
  Pending = 0,
  Agreed = 1,
  Disagreed = 2,
  Unresolved = 3,
}

/** Resolver submission as recorded by ConsensusEngine */
export interface ConsensusSubmission {
  resolver: `0x${string}`;
  verdictHash: `0x${string}`;
  confidence: number;
  evidenceUri: string;
  submittedAt: bigint;
}

/** Outcome after two submissions or expiry */
export interface ConsensusOutcome {
  bountyId: bigint;
  status: ConsensusStatus;
  winningHash?: `0x${string}`;
  winners?: `0x${string}`[];
  shares?: bigint[];
  reason?: string;
  submitter1?: `0x${string}`;
  submitter2?: `0x${string}`;
}

export interface VerdictReceivedEvent {
  bountyId: bigint;
  resolver: `0x${string}`;
  verdictHash: `0x${string}`;
  confidence: number;
  submittedAt: bigint;
}

export interface ConsensusReachedEvent {
  bountyId: bigint;
  winningHash: `0x${string}`;
  winners: `0x${string}`[];
  shares: bigint[];
}

export interface ConsensusFailedEvent {
  bountyId: bigint;
  reason: string;
  submitter1: `0x${string}`;
  submitter2: `0x${string}`;
}

/** Settlement payout breakdown (MVP 60/40 of post-fee distributable) */
export interface PayoutBreakdown {
  bountyId: bigint;
  firstSubmitter: `0x${string}`;
  secondSubmitter: `0x${string}`;
  firstShare: bigint;
  secondShare: bigint;
  distributable: bigint;
  protocolFee: bigint;
}

/** @deprecated Use ConsensusOutcome — kept for backward compatibility during frontend migration */
export interface ConsensusResult {
  bountyId: bigint;
  reached: boolean;
  verdictHash?: `0x${string}`;
  firstSubmitter?: `0x${string}`;
  secondSubmitter?: `0x${string}`;
  reason?: string;
}
