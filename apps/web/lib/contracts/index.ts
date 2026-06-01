import { deployedAddresses } from '@oracle-arena/config';
import type { Address } from 'viem';

export const addresses = {
  bountyBoard: deployedAddresses.bountyBoard as Address,
  consensusEngine: deployedAddresses.consensusEngine as Address,
  settlement: deployedAddresses.settlement as Address,
  resolverRegistry: deployedAddresses.resolverRegistry as Address,
  liFiAdapter: deployedAddresses.liFiAdapter as Address,
  mockLiFiRouter: deployedAddresses.mockLiFiRouter as Address,
  resolverPayoutPrefs: deployedAddresses.resolverPayoutPrefs as Address,
  resolverAgentA: deployedAddresses.resolverAgentA as Address,
  resolverAgentB: deployedAddresses.resolverAgentB as Address,
} as const;

export const bountyBoardAbi = [
  {
    type: 'function',
    name: 'URL_RESOLVABLE_FACT',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'getBounty',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'poster', type: 'address' },
          { name: 'claim', type: 'string' },
          { name: 'evidenceSources', type: 'string[]' },
          { name: 'bountyType', type: 'bytes32' },
          { name: 'deadline', type: 'uint64' },
          { name: 'payout', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'resolvedAt', type: 'uint64' },
          { name: 'winningVerdictHash', type: 'bytes32' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getSubmission',
    stateMutability: 'view',
    inputs: [
      { name: 'bountyId', type: 'uint256' },
      { name: 'resolver', type: 'address' },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'resolver', type: 'address' },
          { name: 'verdictHash', type: 'bytes32' },
          { name: 'confidence', type: 'uint16' },
          { name: 'evidenceUri', type: 'string' },
          { name: 'submittedAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getOpenBounties',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'bountyCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'postBounty',
    stateMutability: 'payable',
    inputs: [
      { name: 'claim', type: 'string' },
      { name: 'evidenceSources', type: 'string[]' },
      { name: 'bountyType', type: 'bytes32' },
      { name: 'deadline', type: 'uint64' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'BountyPosted',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'bountyType', type: 'bytes32', indexed: true },
      { name: 'claim', type: 'string', indexed: false },
      { name: 'evidenceSources', type: 'string[]', indexed: false },
      { name: 'deadline', type: 'uint64', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BountyCancelled',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'refunded', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SubmissionRecorded',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'resolver', type: 'address', indexed: true },
      { name: 'verdictHash', type: 'bytes32', indexed: false },
      { name: 'confidence', type: 'uint16', indexed: false },
      { name: 'evidenceUri', type: 'string', indexed: false },
      { name: 'submittedAt', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BountySettled',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'winningVerdictHash', type: 'bytes32', indexed: false },
      { name: 'winners', type: 'address[]', indexed: false },
      { name: 'payoutShares', type: 'uint256[]', indexed: false },
      { name: 'feeAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BountyUnresolved',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'refundedToPoster', type: 'uint256', indexed: false },
      { name: 'feeAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const consensusEngineAbi = [
  {
    type: 'function',
    name: 'getSubmissions',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'resolver', type: 'address' },
          { name: 'verdictHash', type: 'bytes32' },
          { name: 'confidence', type: 'uint16' },
          { name: 'evidenceUri', type: 'string' },
          { name: 'submittedAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getStatus',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'event',
    name: 'VerdictReceived',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'resolver', type: 'address', indexed: true },
      { name: 'verdictHash', type: 'bytes32', indexed: false },
      { name: 'confidence', type: 'uint16', indexed: false },
      { name: 'submittedAt', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ConsensusReached',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'winningHash', type: 'bytes32', indexed: false },
      { name: 'winners', type: 'address[]', indexed: false },
      { name: 'shares', type: 'uint256[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ConsensusFailed',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'reason', type: 'string', indexed: false },
      { name: 'submitter1', type: 'address', indexed: false },
      { name: 'submitter2', type: 'address', indexed: false },
    ],
  },
] as const;

export const resolverRegistryAbi = [
  {
    type: 'function',
    name: 'getAgent',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'agentAddress', type: 'address' },
          { name: 'operator', type: 'address' },
          { name: 'bond', type: 'uint256' },
          { name: 'typeTags', type: 'bytes32[]' },
          {
            name: 'reputation',
            type: 'tuple',
            components: [
              { name: 'resolutionsAttempted', type: 'uint64' },
              { name: 'resolutionsAgreed', type: 'uint64' },
              { name: 'totalEarnings', type: 'uint256' },
            ],
          },
          { name: 'status', type: 'uint8' },
          { name: 'registeredAt', type: 'uint64' },
          { name: 'withdrawalReadyAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getAgentsForTypeTag',
    stateMutability: 'view',
    inputs: [
      { name: 'tag', type: 'bytes32' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'totalAgents',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'typeTags', type: 'bytes32[]', indexed: false },
      { name: 'bond', type: 'uint256', indexed: false },
      { name: 'registeredAt', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ReputationUpdated',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'agreed', type: 'bool', indexed: false },
      { name: 'earnings', type: 'uint256', indexed: false },
      { name: 'resolutionsAttempted', type: 'uint64', indexed: false },
      { name: 'resolutionsAgreed', type: 'uint64', indexed: false },
    ],
  },
] as const;

export const settlementAbi = [
  {
    type: 'event',
    name: 'PayoutQueued',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'resolver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'queuedAt', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PayoutForwarded',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'resolver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'destinationChain', type: 'uint32', indexed: false },
      { name: 'destinationAsset', type: 'address', indexed: false },
    ],
  },
] as const;

export const mockLiFiRouterAbi = [
  {
    type: 'event',
    name: 'MockBridgeRequest',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'destinationChain', type: 'uint32', indexed: false },
      { name: 'destinationAsset', type: 'address', indexed: false },
      { name: 'destinationRecipient', type: 'address', indexed: false },
    ],
  },
] as const;

export type OnChainBounty = {
  id: bigint;
  poster: Address;
  claim: string;
  evidenceSources: readonly string[];
  bountyType: `0x${string}`;
  deadline: bigint;
  /** Remaining escrow on contract (zeroed after settle/cancel) */
  payout: bigint;
  /** Original posted amount for display — use this in UI */
  displayPayout: bigint;
  status: number;
  createdAt: bigint;
  resolvedAt: bigint;
  winningVerdictHash: `0x${string}`;
};

export const resolverPayoutPrefsAbi = [
  {
    type: 'function',
    name: 'getPreference',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'mode', type: 'uint8' },
          { name: 'destinationChain', type: 'uint32' },
          { name: 'destinationAsset', type: 'address' },
          { name: 'destinationRecipient', type: 'address' },
        ],
      },
    ],
  },
] as const;

export type PayoutPrefRecord = {
  mode: number;
  destinationChain: number;
  destinationAsset: Address;
  destinationRecipient: Address;
};

export type OnChainSubmission = {
  resolver: Address;
  verdictHash: `0x${string}`;
  confidence: number;
  evidenceUri: string;
  submittedAt: bigint;
};

export type AgentRecord = {
  agentAddress: Address;
  operator: Address;
  bond: bigint;
  typeTags: readonly `0x${string}`[];
  reputation: {
    resolutionsAttempted: bigint;
    resolutionsAgreed: bigint;
    totalEarnings: bigint;
  };
  status: number;
  registeredAt: bigint;
};
