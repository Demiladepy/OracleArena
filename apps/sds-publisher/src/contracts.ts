import { type Address } from 'viem';
import { deployedAddresses } from '@oracle-arena/config';

export const contractAddresses = {
  bountyBoard: deployedAddresses.bountyBoard,
  consensusEngine: deployedAddresses.consensusEngine,
  settlement: deployedAddresses.settlement,
  resolverRegistry: deployedAddresses.resolverRegistry,
} as const satisfies Record<string, Address>;

export const bountyBoardAbi = [
  {
    type: 'function',
    name: 'getBounty',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        name: '',
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
] as const;

export const resolverRegistryAbi = [
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
  {
    type: 'event',
    name: 'WithdrawalRequested',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'readyAt', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WithdrawalCompleted',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'refunded', type: 'uint256', indexed: false },
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
