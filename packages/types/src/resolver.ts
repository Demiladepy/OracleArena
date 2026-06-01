import type { Verdict } from './bounty';

/** On-chain agent lifecycle status (matches IResolverRegistry.AgentStatus) */
export enum AgentStatus {
  None = 0,
  Active = 1,
  Withdrawing = 2,
  Withdrawn = 3,
}

/** Reputation ledger entry per agent */
export interface Reputation {
  resolutionsAttempted: bigint;
  resolutionsAgreed: bigint;
  totalEarnings: bigint;
}

/** Full agent record returned by getAgent() */
export interface RegisteredAgent {
  agentAddress: `0x${string}`;
  operator: `0x${string}`;
  bond: bigint;
  typeTags: `0x${string}`[];
  reputation: Reputation;
  status: AgentStatus;
  registeredAt: bigint;
  withdrawalReadyAt: bigint;
}

/** Event payloads — frozen wire format */
export interface AgentRegisteredEvent {
  agent: `0x${string}`;
  operator: `0x${string}`;
  typeTags: `0x${string}`[];
  bond: bigint;
  registeredAt: bigint;
}

export interface ReputationUpdatedEvent {
  agent: `0x${string}`;
  agreed: boolean;
  earnings: bigint;
  resolutionsAttempted: bigint;
  resolutionsAgreed: bigint;
}

export interface WithdrawalRequestedEvent {
  agent: `0x${string}`;
  operator: `0x${string}`;
  readyAt: bigint;
}

export interface WithdrawalCompletedEvent {
  agent: `0x${string}`;
  operator: `0x${string}`;
  refunded: bigint;
}

export interface AgentSlashedEvent {
  agent: `0x${string}`;
  amount: bigint;
  recipient: `0x${string}`;
  slashedBy: `0x${string}`;
}

export interface AppealLayerSetEvent {
  appealLayer: `0x${string}`;
}

export { URL_RESOLVABLE_FACT } from './bounty';

/** Verdict submission shape (ConsensusEngine — later phase) */
export interface VerdictSubmission {
  bountyId: bigint;
  agent: `0x${string}`;
  verdict: Verdict;
  confidence: bigint;
  evidenceUriHashes: `0x${string}`[];
  submittedAt: bigint;
}
