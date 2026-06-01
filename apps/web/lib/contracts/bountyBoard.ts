import { parseAbiItem } from 'viem';
import { publicClient } from '../viem';
import {
  addresses,
  bountyBoardAbi,
  consensusEngineAbi,
  resolverRegistryAbi,
  type AgentRecord,
  type OnChainBounty,
  type OnChainSubmission,
} from '../contracts';
import { isActiveBountyStatus } from '../utils/bounty';
import { getLogsChunked } from '../utils/logs';

const bountyPostedEvent = parseAbiItem(
  'event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 indexed bountyType, string claim, string[] evidenceSources, uint64 deadline, uint256 payout)',
);

let postedPayoutCache: Map<string, bigint> | null = null;

export function clearPostedPayoutCache(): void {
  postedPayoutCache = null;
}

/** Settled bounties zero `payout` on-chain — recover from BountyPosted logs */
export async function fetchPostedPayoutMap(): Promise<Map<string, bigint>> {
  if (postedPayoutCache) return postedPayoutCache;

  const map = new Map<string, bigint>();

  try {
    const logs = await getLogsChunked({
      address: addresses.bountyBoard,
      event: bountyPostedEvent,
      maxChunks: 30,
    });

    for (const log of logs) {
      const id = log.args.bountyId?.toString();
      const payout = log.args.payout as bigint | undefined;
      if (id && payout !== undefined) {
        map.set(id, payout);
      }
    }
  } catch {
    // Strategy B fallback: known demo bounties
    const count = await fetchBountyCount();
    for (let id = 1n; id <= count; id++) {
      try {
        const bounty = await publicClient.readContract({
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          functionName: 'getBounty',
          args: [id],
        });
        if (bounty.payout > 0n) {
          map.set(id.toString(), bounty.payout);
        }
      } catch {
        // skip
      }
    }
  }

  postedPayoutCache = map;
  return map;
}

function withDisplayPayout(
  raw: Omit<OnChainBounty, 'displayPayout'>,
  posted: Map<string, bigint>,
): OnChainBounty {
  const postedAmount = posted.get(raw.id.toString()) ?? 0n;
  const displayPayout = raw.payout > 0n ? raw.payout : postedAmount;
  return { ...raw, displayPayout };
}

export async function fetchBounty(bountyId: bigint): Promise<OnChainBounty> {
  const raw = (await publicClient.readContract({
    address: addresses.bountyBoard,
    abi: bountyBoardAbi,
    functionName: 'getBounty',
    args: [bountyId],
  })) as Omit<OnChainBounty, 'displayPayout'>;

  const posted = await fetchPostedPayoutMap();
  return withDisplayPayout(raw, posted);
}

export async function fetchBountyCount(): Promise<bigint> {
  return publicClient.readContract({
    address: addresses.bountyBoard,
    abi: bountyBoardAbi,
    functionName: 'bountyCount',
  });
}

export async function fetchMarketplaceBounties(limit = 32): Promise<OnChainBounty[]> {
  const count = await fetchBountyCount();
  const posted = await fetchPostedPayoutMap();
  const byId = new Map<string, OnChainBounty>();

  for (let id = count; id >= 1n && byId.size < limit; id--) {
    try {
      const raw = (await publicClient.readContract({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'getBounty',
        args: [id],
      })) as Omit<OnChainBounty, 'displayPayout'>;
      const bounty = withDisplayPayout(raw, posted);
      byId.set(bounty.id.toString(), bounty);
    } catch {
      // skip missing
    }
  }

  return [...byId.values()].sort((a, b) => Number(b.id - a.id));
}

export async function fetchActiveBounties(limit = 24): Promise<OnChainBounty[]> {
  const all = await fetchMarketplaceBounties(limit * 2);
  return all.filter((b) => isActiveBountyStatus(b.status)).slice(0, limit);
}

export async function fetchMarketStats() {
  const count = await fetchBountyCount();
  const posted = await fetchPostedPayoutMap();
  const totalAgents = await publicClient.readContract({
    address: addresses.resolverRegistry,
    abi: resolverRegistryAbi,
    functionName: 'totalAgents',
  });

  let resolved = 0;
  let volume = 0n;

  for (let id = 1n; id <= count; id++) {
    try {
      const raw = (await publicClient.readContract({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'getBounty',
        args: [id],
      })) as Omit<OnChainBounty, 'displayPayout'>;
      if (raw.status === 2) {
        resolved++;
        volume += raw.payout > 0n ? raw.payout : (posted.get(id.toString()) ?? 0n);
      }
    } catch {
      // skip
    }
  }

  return {
    totalBounties: Number(count),
    totalResolvers: Number(totalAgents),
    totalResolved: resolved,
    totalVolume: volume,
  };
}

export async function fetchConsensusSubmissions(bountyId: bigint): Promise<OnChainSubmission[]> {
  return publicClient.readContract({
    address: addresses.consensusEngine,
    abi: consensusEngineAbi,
    functionName: 'getSubmissions',
    args: [bountyId],
  }) as Promise<OnChainSubmission[]>;
}

export async function fetchConsensusStatus(bountyId: bigint): Promise<number> {
  return publicClient.readContract({
    address: addresses.consensusEngine,
    abi: consensusEngineAbi,
    functionName: 'getStatus',
    args: [bountyId],
  });
}

export async function fetchAgent(agent: `0x${string}`): Promise<AgentRecord | null> {
  try {
    return (await publicClient.readContract({
      address: addresses.resolverRegistry,
      abi: resolverRegistryAbi,
      functionName: 'getAgent',
      args: [agent],
    })) as AgentRecord;
  } catch {
    return null;
  }
}

export async function fetchAgentsForType(typeTag: `0x${string}`): Promise<readonly `0x${string}`[]> {
  return publicClient.readContract({
    address: addresses.resolverRegistry,
    abi: resolverRegistryAbi,
    functionName: 'getAgentsForTypeTag',
    args: [typeTag, 0n, 50n],
  });
}

export async function fetchUrlResolvableFactType(): Promise<`0x${string}`> {
  return publicClient.readContract({
    address: addresses.bountyBoard,
    abi: bountyBoardAbi,
    functionName: 'URL_RESOLVABLE_FACT',
  });
}
