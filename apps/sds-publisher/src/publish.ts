import { SchemaEncoder } from '@somnia-chain/streams';
import { encodePacked, keccak256, type Address, type Hex } from 'viem';
import { createSdsSdk } from './sdk.js';
import { computeSchemaIds } from './schema-ids.js';
import {
  BOUNTIES_SCHEMA,
  RESOLVERS_SCHEMA,
  SETTLEMENTS_SCHEMA,
  SUBMISSIONS_SCHEMA,
} from './schemas.js';

export function bountyDataId(bountyId: bigint): Hex {
  return keccak256(encodePacked(['string', 'uint256'], ['bounty:', bountyId]));
}

export function submissionDataId(bountyId: bigint, resolver: Address): Hex {
  return keccak256(encodePacked(['string', 'uint256', 'address'], ['submission:', bountyId, resolver]));
}

export function resolverDataId(agent: Address): Hex {
  return keccak256(encodePacked(['string', 'address'], ['resolver:', agent]));
}

export function settlementDataId(bountyId: bigint): Hex {
  return keccak256(encodePacked(['string', 'uint256'], ['settlement:', bountyId]));
}

export async function publishBountyRecord(
  sdk: ReturnType<typeof createSdsSdk>,
  schemaId: Hex,
  record: {
    createdAt: bigint;
    bountyId: bigint;
    poster: Address;
    bountyType: Hex;
    claim: string;
    deadline: bigint;
    payout: bigint;
    status: number;
  },
) {
  const encoder = new SchemaEncoder(BOUNTIES_SCHEMA);
  const data = encoder.encodeData([
    { name: 'createdAt', value: record.createdAt, type: 'uint64' },
    { name: 'bountyId', value: record.bountyId, type: 'uint256' },
    { name: 'poster', value: record.poster, type: 'address' },
    { name: 'bountyType', value: record.bountyType, type: 'bytes32' },
    { name: 'claim', value: record.claim, type: 'string' },
    { name: 'deadline', value: record.deadline, type: 'uint64' },
    { name: 'payout', value: record.payout, type: 'uint256' },
    { name: 'status', value: record.status, type: 'uint8' },
  ]);

  const id = bountyDataId(record.bountyId);
  const tx = await sdk.streams.set([{ id, schemaId, data }]);
  console.log(`[sds] bounty ${record.bountyId} status=${record.status} tx=${tx}`);
  return tx;
}

export async function publishSubmissionRecord(
  sdk: ReturnType<typeof createSdsSdk>,
  schemaId: Hex,
  record: {
    submittedAt: bigint;
    bountyId: bigint;
    resolver: Address;
    verdictHash: Hex;
    confidence: number;
    evidenceUri: string;
  },
) {
  const encoder = new SchemaEncoder(SUBMISSIONS_SCHEMA);
  const data = encoder.encodeData([
    { name: 'submittedAt', value: record.submittedAt, type: 'uint64' },
    { name: 'bountyId', value: record.bountyId, type: 'uint256' },
    { name: 'resolver', value: record.resolver, type: 'address' },
    { name: 'verdictHash', value: record.verdictHash, type: 'bytes32' },
    { name: 'confidence', value: record.confidence, type: 'uint16' },
    { name: 'evidenceUri', value: record.evidenceUri, type: 'string' },
  ]);

  const id = submissionDataId(record.bountyId, record.resolver);
  const tx = await sdk.streams.set([{ id, schemaId, data }]);
  console.log(`[sds] submission bounty=${record.bountyId} resolver=${record.resolver} tx=${tx}`);
  return tx;
}

export async function publishResolverRecord(
  sdk: ReturnType<typeof createSdsSdk>,
  schemaId: Hex,
  record: {
    registeredAt: bigint;
    agent: Address;
    operator: Address;
    bond: bigint;
    resolutionsAttempted: bigint;
    resolutionsAgreed: bigint;
    totalEarnings: bigint;
    status: number;
  },
) {
  const encoder = new SchemaEncoder(RESOLVERS_SCHEMA);
  const data = encoder.encodeData([
    { name: 'registeredAt', value: record.registeredAt, type: 'uint64' },
    { name: 'agent', value: record.agent, type: 'address' },
    { name: 'operator', value: record.operator, type: 'address' },
    { name: 'bond', value: record.bond, type: 'uint256' },
    { name: 'resolutionsAttempted', value: record.resolutionsAttempted, type: 'uint64' },
    { name: 'resolutionsAgreed', value: record.resolutionsAgreed, type: 'uint64' },
    { name: 'totalEarnings', value: record.totalEarnings, type: 'uint256' },
    { name: 'status', value: record.status, type: 'uint8' },
  ]);

  const id = resolverDataId(record.agent);
  const tx = await sdk.streams.set([{ id, schemaId, data }]);
  console.log(`[sds] resolver ${record.agent} tx=${tx}`);
  return tx;
}

export async function publishSettlementRecord(
  sdk: ReturnType<typeof createSdsSdk>,
  schemaId: Hex,
  record: {
    settledAt: bigint;
    bountyId: bigint;
    winningVerdictHash: Hex;
    winners: Address[];
    shares: bigint[];
    feeAmount: bigint;
  },
) {
  const encoder = new SchemaEncoder(SETTLEMENTS_SCHEMA);
  const data = encoder.encodeData([
    { name: 'settledAt', value: record.settledAt, type: 'uint64' },
    { name: 'bountyId', value: record.bountyId, type: 'uint256' },
    { name: 'winningVerdictHash', value: record.winningVerdictHash, type: 'bytes32' },
    { name: 'winners', value: record.winners, type: 'address[]' },
    { name: 'shares', value: record.shares, type: 'uint256[]' },
    { name: 'feeAmount', value: record.feeAmount, type: 'uint256' },
  ]);

  const id = settlementDataId(record.bountyId);
  const tx = await sdk.streams.set([{ id, schemaId, data }]);
  console.log(`[sds] settlement bounty=${record.bountyId} tx=${tx}`);
  return tx;
}

export async function loadSchemaIds(sdk: ReturnType<typeof createSdsSdk>) {
  return computeSchemaIds(sdk);
}
