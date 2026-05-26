import type { Verdict } from './bounty';

/** Registered resolver agent metadata */
export interface ResolverAgent {
  address: `0x${string}`;
  typeTags: `0x${string}`[];
  bondAmount: bigint;
  reputation: bigint;
  payoutChainId: number;
  payoutAsset: `0x${string}`;
}

/** Verdict submission to ConsensusEngine */
export interface VerdictSubmission {
  bountyId: bigint;
  agent: `0x${string}`;
  verdict: Verdict;
  confidence: bigint;
  evidenceUriHashes: `0x${string}`[];
  submittedAt: bigint;
}

/** Resolver payout preference */
export interface PayoutPreference {
  chainId: number;
  asset: `0x${string}`;
}
