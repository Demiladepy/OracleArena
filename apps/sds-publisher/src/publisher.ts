import { createPublicClient, http, type Chain } from 'viem';
import { watchContractEvent } from 'viem/actions';
import { somniaTestnet } from '@oracle-arena/config';
import { loadEnv } from './env.js';
import { createSdsSdk } from './sdk.js';
import { computeSchemaIds } from './schema-ids.js';
import {
  bountyBoardAbi,
  consensusEngineAbi,
  contractAddresses,
  resolverRegistryAbi,
  settlementAbi,
} from './contracts.js';
import {
  publishBountyRecord,
  publishResolverRecord,
  publishSettlementRecord,
  publishSubmissionRecord,
} from './publish.js';
import { AgentStatus, BountyStatus } from './schemas.js';

const chain: Chain = { ...somniaTestnet, contracts: {} };

async function main() {
  const env = loadEnv();
  const sdk = createSdsSdk(true);
  const schemaIds = await computeSchemaIds(sdk);

  console.log('Oracle Arena SDS publisher starting');
  console.log('RPC:', env.rpcUrl);
  console.log('Schema IDs:', schemaIds);

  const publicClient = createPublicClient({ chain, transport: http(env.rpcUrl) });
  const bountyCache = new Map<string, { poster: `0x${string}`; bountyType: `0x${string}`; claim: string; deadline: bigint; payout: bigint; createdAt: bigint }>();
  const resolverMeta = new Map<string, { operator: `0x${string}`; bond: bigint; registeredAt: bigint }>();

  const publishBounty = async (
    bountyId: bigint,
    status: number,
    blockTimestamp: bigint,
    overrides?: Partial<{ poster: `0x${string}`; bountyType: `0x${string}`; claim: string; deadline: bigint; payout: bigint; createdAt: bigint }>,
  ) => {
    const key = bountyId.toString();
    const cached = bountyCache.get(key);
    const merged = { ...cached, ...overrides };
    if (!merged.poster || !merged.bountyType || merged.claim === undefined) {
      console.warn(`[skip] missing bounty cache for ${bountyId}`);
      return;
    }
    bountyCache.set(key, merged as typeof cached & Required<typeof merged>);
    try {
      await publishBountyRecord(sdk, schemaIds.bounties, {
        createdAt: merged.createdAt ?? blockTimestamp,
        bountyId,
        poster: merged.poster,
        bountyType: merged.bountyType,
        claim: merged.claim,
        deadline: merged.deadline ?? 0n,
        payout: merged.payout ?? 0n,
        status,
      });
    } catch (error) {
      console.error('[error] publish bounty', bountyId, error);
    }
  };

  watchContractEvent(publicClient, {
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    eventName: 'BountyPosted',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.bountyId) continue;
        const createdAt = BigInt(log.blockTimestamp ?? 0);
        bountyCache.set(args.bountyId.toString(), {
          poster: args.poster!,
          bountyType: args.bountyType!,
          claim: args.claim ?? '',
          deadline: args.deadline ?? 0n,
          payout: args.payout ?? 0n,
          createdAt,
        });
        await publishBounty(args.bountyId, BountyStatus.Open, createdAt, {
          poster: args.poster,
          bountyType: args.bountyType,
          claim: args.claim,
          deadline: args.deadline,
          payout: args.payout,
          createdAt,
        });
      }
    },
    onError: (error) => console.error('[watch] BountyPosted', error),
  });

  watchContractEvent(publicClient, {
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    eventName: 'BountyCancelled',
    onLogs: async (logs) => {
      for (const log of logs) {
        const bountyId = log.args.bountyId;
        if (!bountyId) continue;
        await publishBounty(bountyId, BountyStatus.Cancelled, BigInt(log.blockTimestamp ?? 0));
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    eventName: 'BountySettled',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.bountyId) continue;
        const ts = BigInt(log.blockTimestamp ?? 0);
        await publishBounty(args.bountyId, BountyStatus.Resolved, ts);
        try {
          await publishSettlementRecord(sdk, schemaIds.settlements, {
            settledAt: ts,
            bountyId: args.bountyId,
            winningVerdictHash: args.winningVerdictHash ?? '0x0',
            winners: [...(args.winners ?? [])],
            shares: [...(args.payoutShares ?? [])],
            feeAmount: args.feeAmount ?? 0n,
          });
        } catch (error) {
          console.error('[error] publish settlement from BountySettled', error);
        }
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    eventName: 'BountyUnresolved',
    onLogs: async (logs) => {
      for (const log of logs) {
        const bountyId = log.args.bountyId;
        if (!bountyId) continue;
        await publishBounty(bountyId, BountyStatus.Unresolved, BigInt(log.blockTimestamp ?? 0));
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    eventName: 'SubmissionRecorded',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.bountyId || !args.resolver) continue;
        try {
          await publishSubmissionRecord(sdk, schemaIds.submissions, {
            submittedAt: args.submittedAt ?? BigInt(log.blockTimestamp ?? 0),
            bountyId: args.bountyId,
            resolver: args.resolver,
            verdictHash: args.verdictHash ?? '0x0',
            confidence: Number(args.confidence ?? 0),
            evidenceUri: args.evidenceUri ?? '',
          });
        } catch (error) {
          console.error('[error] publish submission', error);
        }
        await publishBounty(args.bountyId, BountyStatus.Submitted, BigInt(log.blockTimestamp ?? 0));
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.consensusEngine,
    abi: consensusEngineAbi,
    eventName: 'VerdictReceived',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.bountyId || !args.resolver) continue;
        try {
          await publishSubmissionRecord(sdk, schemaIds.submissions, {
            submittedAt: args.submittedAt ?? BigInt(log.blockTimestamp ?? 0),
            bountyId: args.bountyId,
            resolver: args.resolver,
            verdictHash: args.verdictHash ?? '0x0',
            confidence: Number(args.confidence ?? 0),
            evidenceUri: '',
          });
        } catch (error) {
          console.error('[error] publish verdict', error);
        }
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.consensusEngine,
    abi: consensusEngineAbi,
    eventName: 'ConsensusReached',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.bountyId) continue;
        const ts = BigInt(log.blockTimestamp ?? 0);
        try {
          await publishSettlementRecord(sdk, schemaIds.settlements, {
            settledAt: ts,
            bountyId: args.bountyId,
            winningVerdictHash: args.winningHash ?? '0x0',
            winners: [...(args.winners ?? [])],
            shares: [...(args.shares ?? [])],
            feeAmount: 0n,
          });
        } catch (error) {
          console.error('[error] publish settlement from ConsensusReached', error);
        }
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.resolverRegistry,
    abi: resolverRegistryAbi,
    eventName: 'AgentRegistered',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.agent || !args.operator) continue;
        resolverMeta.set(args.agent.toLowerCase(), {
          operator: args.operator,
          bond: args.bond ?? 0n,
          registeredAt: args.registeredAt ?? BigInt(log.blockTimestamp ?? 0),
        });
        try {
          await publishResolverRecord(sdk, schemaIds.resolvers, {
            registeredAt: args.registeredAt ?? BigInt(log.blockTimestamp ?? 0),
            agent: args.agent,
            operator: args.operator,
            bond: args.bond ?? 0n,
            resolutionsAttempted: 0n,
            resolutionsAgreed: 0n,
            totalEarnings: 0n,
            status: AgentStatus.Active,
          });
        } catch (error) {
          console.error('[error] publish resolver registration', error);
        }
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.resolverRegistry,
    abi: resolverRegistryAbi,
    eventName: 'ReputationUpdated',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = log.args;
        if (!args.agent) continue;
        const meta = resolverMeta.get(args.agent.toLowerCase());
        try {
          await publishResolverRecord(sdk, schemaIds.resolvers, {
            registeredAt: meta?.registeredAt ?? BigInt(log.blockTimestamp ?? 0),
            agent: args.agent,
            operator: meta?.operator ?? args.agent,
            bond: meta?.bond ?? 0n,
            resolutionsAttempted: args.resolutionsAttempted ?? 0n,
            resolutionsAgreed: args.resolutionsAgreed ?? 0n,
            totalEarnings: args.earnings ?? 0n,
            status: AgentStatus.Active,
          });
        } catch (error) {
          console.error('[error] publish reputation update', error);
        }
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.settlement,
    abi: settlementAbi,
    eventName: 'PayoutQueued',
    onLogs: (logs) => {
      for (const log of logs) {
        console.log('[settlement] PayoutQueued', log.args);
      }
    },
  });

  watchContractEvent(publicClient, {
    address: env.settlement,
    abi: settlementAbi,
    eventName: 'PayoutForwarded',
    onLogs: (logs) => {
      for (const log of logs) {
        console.log('[settlement] PayoutForwarded', log.args);
      }
    },
  });

  console.log('Listening for events on', contractAddresses);
  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
