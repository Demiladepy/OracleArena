/** Oracle Arena SDS schema definitions — field layouts registered on Somnia Data Streams */

export const BOUNTIES_SCHEMA_NAME = 'oracle-arena:bounties:v1' as const;
export const BOUNTIES_SCHEMA =
  'uint64 createdAt, uint256 bountyId, address poster, bytes32 bountyType, string claim, uint64 deadline, uint256 payout, uint8 status' as const;

export const SUBMISSIONS_SCHEMA_NAME = 'oracle-arena:submissions:v1' as const;
export const SUBMISSIONS_SCHEMA =
  'uint64 submittedAt, uint256 bountyId, address resolver, bytes32 verdictHash, uint16 confidence, string evidenceUri' as const;

export const RESOLVERS_SCHEMA_NAME = 'oracle-arena:resolvers:v1' as const;
export const RESOLVERS_SCHEMA =
  'uint64 registeredAt, address agent, address operator, uint256 bond, uint64 resolutionsAttempted, uint64 resolutionsAgreed, uint256 totalEarnings, uint8 status' as const;

export const SETTLEMENTS_SCHEMA_NAME = 'oracle-arena:settlements:v1' as const;
export const SETTLEMENTS_SCHEMA =
  'uint64 settledAt, uint256 bountyId, bytes32 winningVerdictHash, address[] winners, uint256[] shares, uint256 feeAmount' as const;

export const ALL_SCHEMAS = [
  { schemaName: BOUNTIES_SCHEMA_NAME, schema: BOUNTIES_SCHEMA },
  { schemaName: SUBMISSIONS_SCHEMA_NAME, schema: SUBMISSIONS_SCHEMA },
  { schemaName: RESOLVERS_SCHEMA_NAME, schema: RESOLVERS_SCHEMA },
  { schemaName: SETTLEMENTS_SCHEMA_NAME, schema: SETTLEMENTS_SCHEMA },
] as const;

/** BountyStatus enum aligned with IBountyBoard */
export const BountyStatus = {
  Open: 0,
  Submitted: 1,
  Resolved: 2,
  Unresolved: 3,
  Cancelled: 4,
} as const;

/** AgentStatus enum aligned with IResolverRegistry */
export const AgentStatus = {
  None: 0,
  Active: 1,
  Withdrawing: 2,
  Withdrawn: 3,
} as const;

export type SchemaName = (typeof ALL_SCHEMAS)[number]['schemaName'];
