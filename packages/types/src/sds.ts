export const SDS_SCHEMA_NAMES = {
  bounties: 'oracle-arena:bounties:v1',
  submissions: 'oracle-arena:submissions:v1',
  resolvers: 'oracle-arena:resolvers:v1',
  settlements: 'oracle-arena:settlements:v1',
} as const;

export const SDS_SCHEMAS = {
  bounties:
    'uint64 createdAt, uint256 bountyId, address poster, bytes32 bountyType, string claim, uint64 deadline, uint256 payout, uint8 status',
  submissions:
    'uint64 submittedAt, uint256 bountyId, address resolver, bytes32 verdictHash, uint16 confidence, string evidenceUri',
  resolvers:
    'uint64 registeredAt, address agent, address operator, uint256 bond, uint64 resolutionsAttempted, uint64 resolutionsAgreed, uint256 totalEarnings, uint8 status',
  settlements:
    'uint64 settledAt, uint256 bountyId, bytes32 winningVerdictHash, address[] winners, uint256[] shares, uint256 feeAmount',
} as const;

export interface SdsBountyRecord {
  createdAt: bigint;
  bountyId: bigint;
  poster: `0x${string}`;
  bountyType: `0x${string}`;
  claim: string;
  deadline: bigint;
  payout: bigint;
  status: number;
}

export interface SdsSubmissionRecord {
  submittedAt: bigint;
  bountyId: bigint;
  resolver: `0x${string}`;
  verdictHash: `0x${string}`;
  confidence: number;
  evidenceUri: string;
}

export interface SdsResolverRecord {
  registeredAt: bigint;
  agent: `0x${string}`;
  operator: `0x${string}`;
  bond: bigint;
  resolutionsAttempted: bigint;
  resolutionsAgreed: bigint;
  totalEarnings: bigint;
  status: number;
}

export interface SdsSettlementRecord {
  settledAt: bigint;
  bountyId: bigint;
  winningVerdictHash: `0x${string}`;
  winners: `0x${string}`[];
  shares: bigint[];
  feeAmount: bigint;
}

export interface SdsSchemaIds {
  bounties: `0x${string}`;
  submissions: `0x${string}`;
  resolvers: `0x${string}`;
  settlements: `0x${string}`;
}
