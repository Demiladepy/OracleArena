/** Bounty lifecycle status — matches IBountyBoard.BountyStatus */
export enum BountyStatus {
  Open = 0,
  Submitted = 1,
  Resolved = 2,
  Unresolved = 3,
  Cancelled = 4,
}

/** MVP bounty type tag — keccak256("URL_RESOLVABLE_FACT") */
export const URL_RESOLVABLE_FACT =
  '0xa33c8d070672fcb09b8793d4f6476727b2eba9543cf0baeff41db1aae1211dd0' as `0x${string}`;

/** On-chain bounty record */
export interface Bounty {
  id: bigint;
  poster: `0x${string}`;
  claim: string;
  evidenceSources: string[];
  bountyType: `0x${string}`;
  deadline: bigint;
  payout: bigint;
  status: BountyStatus;
  createdAt: bigint;
  resolvedAt: bigint;
  winningVerdictHash: `0x${string}`;
}

/** Resolver submission recorded on BountyBoard */
export interface Submission {
  resolver: `0x${string}`;
  verdictHash: `0x${string}`;
  confidence: number;
  evidenceUri: string;
  submittedAt: bigint;
}

/** Parameters for posting a bounty from the frontend (later phase) */
export interface PostBountyParams {
  claim: string;
  evidenceSources: string[];
  bountyType: `0x${string}`;
  deadline: Date;
  payoutAmount: bigint;
}

export interface BountyPostedEvent {
  bountyId: bigint;
  poster: `0x${string}`;
  bountyType: `0x${string}`;
  claim: string;
  evidenceSources: string[];
  deadline: bigint;
  payout: bigint;
}

export interface BountyCancelledEvent {
  bountyId: bigint;
  poster: `0x${string}`;
  refunded: bigint;
}

export interface SubmissionRecordedEvent {
  bountyId: bigint;
  resolver: `0x${string}`;
  verdictHash: `0x${string}`;
  confidence: number;
  evidenceUri: string;
  submittedAt: bigint;
}

export interface BountySettledEvent {
  bountyId: bigint;
  winningVerdictHash: `0x${string}`;
  winners: `0x${string}`[];
  payoutShares: bigint[];
  feeAmount: bigint;
}

export interface BountyUnresolvedEvent {
  bountyId: bigint;
  refundedToPoster: bigint;
  feeAmount: bigint;
}

/** Runtime helper — compute URL_RESOLVABLE_FACT bytes32 via viem */
export const BOUNTY_TYPE_URL_RESOLVABLE_FACT_LABEL = 'URL_RESOLVABLE_FACT';
