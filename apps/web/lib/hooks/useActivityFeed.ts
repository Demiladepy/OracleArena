'use client';

import { useEffect, useRef, useState } from 'react';
import { type Address, parseAbiItem } from 'viem';
import { watchContractEvent } from 'viem/actions';
import { publicClient } from '../viem';
import {
  addresses,
  bountyBoardAbi,
  consensusEngineAbi,
  resolverRegistryAbi,
} from '../contracts';
import { fetchBounty, fetchBountyCount } from '../contracts/bountyBoard';
import { formatAddress, formatSTT } from '../utils/format';
import { getLogsChunked } from '../utils/logs';

export type ActivityItem = {
  id: string;
  type: 'bounty_posted' | 'consensus_reached' | 'agent_registered' | 'bounty_cancelled' | 'submission';
  title: string;
  detail: string;
  timestamp: bigint;
  href?: string;
};

const MAX_ITEMS = 20;

const bountyPostedEvent = parseAbiItem(
  'event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 indexed bountyType, string claim, string[] evidenceSources, uint64 deadline, uint256 payout)',
);
const consensusReachedEvent = parseAbiItem(
  'event ConsensusReached(uint256 indexed bountyId, bytes32 winningHash, address[] winners, uint256[] shares)',
);
const agentRegisteredEvent = parseAbiItem(
  'event AgentRegistered(address indexed agent, address indexed operator, bytes32[] typeTags, uint256 bond, uint64 registeredAt)',
);
const bountyCancelledEvent = parseAbiItem(
  'event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refunded)',
);

/**
 * Strategy A: chunked eth_getLogs (≤1000 blocks per Somnia RPC cap).
 * Strategy B fallback: synthetic items from bountyCount + createdAt if chunking fails.
 */
async function loadHistoricalActivity(): Promise<ActivityItem[]> {
  try {
    const [posted, consensus, registered, cancelled] = await Promise.all([
      getLogsChunked({ address: addresses.bountyBoard, event: bountyPostedEvent, maxChunks: 20 }),
      getLogsChunked({ address: addresses.consensusEngine, event: consensusReachedEvent, maxChunks: 20 }),
      getLogsChunked({ address: addresses.resolverRegistry, event: agentRegisteredEvent, maxChunks: 20 }),
      getLogsChunked({ address: addresses.bountyBoard, event: bountyCancelledEvent, maxChunks: 20 }),
    ]);

    const historical: (ActivityItem & { block: bigint; logIndex: number })[] = [
      ...posted.map((log) => ({
        id: `posted-${log.transactionHash}-${log.logIndex}`,
        type: 'bounty_posted' as const,
        title: 'Bounty posted',
        detail: `${formatSTT(log.args.payout as bigint)} · ${String(log.args.claim).slice(0, 60)}`,
        timestamp: 0n,
        href: `/bounty/${log.args.bountyId}`,
        block: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
      })),
      ...consensus.map((log) => ({
        id: `consensus-${log.transactionHash}-${log.logIndex}`,
        type: 'consensus_reached' as const,
        title: 'Consensus reached',
        detail: `Bounty #${log.args.bountyId}`,
        timestamp: 0n,
        href: `/bounty/${log.args.bountyId}`,
        block: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
      })),
      ...registered.map((log) => ({
        id: `agent-${log.transactionHash}-${log.logIndex}`,
        type: 'agent_registered' as const,
        title: 'Resolver registered',
        detail: formatAddress(log.args.agent as Address),
        timestamp: 0n,
        block: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
      })),
      ...cancelled.map((log) => ({
        id: `cancel-${log.transactionHash}-${log.logIndex}`,
        type: 'bounty_cancelled' as const,
        title: 'Bounty cancelled',
        detail: `Refund ${formatSTT(log.args.refunded as bigint)}`,
        timestamp: 0n,
        href: `/bounty/${log.args.bountyId}`,
        block: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
      })),
    ];

    historical.sort((a, b) => {
      if (a.block !== b.block) return Number(b.block - a.block);
      return b.logIndex - a.logIndex;
    });

    return historical.slice(0, MAX_ITEMS).map(({ id, type, title, detail, timestamp, href }) => ({
      id,
      type,
      title,
      detail,
      timestamp,
      href,
    }));
  } catch {
    // Strategy B — bootstrap from on-chain bounty records (no log scan)
    const count = await fetchBountyCount();
    const items: ActivityItem[] = [];

    for (let id = count; id >= 1n && items.length < MAX_ITEMS; id--) {
      try {
        const bounty = await fetchBounty(id);
        items.push({
          id: `bootstrap-posted-${id}`,
          type: 'bounty_posted',
          title: `Bounty #${id} posted`,
          detail: `${formatSTT(bounty.displayPayout)} · ${bounty.claim.slice(0, 60)}`,
          timestamp: bounty.createdAt,
          href: `/bounty/${id}`,
        });
      } catch {
        // skip
      }
    }

    return items;
  }
}

export function useActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let unwatchFns: (() => void)[] = [];

    function push(item: ActivityItem) {
      if (seen.current.has(item.id)) return;
      seen.current.add(item.id);
      setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
    }

    async function startWatchers() {
      const historical = await loadHistoricalActivity();
      historical.forEach((item) => push(item));
      setLoading(false);
      setLive(true);

      unwatchFns = [
        watchContractEvent(publicClient, {
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          eventName: 'BountyPosted',
          onLogs: (logs) => {
            logs.forEach((log) => {
              push({
                id: `posted-${log.transactionHash}-${log.logIndex}`,
                type: 'bounty_posted',
                title: 'Bounty posted',
                detail: String(log.args.claim).slice(0, 80),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                href: `/bounty/${log.args.bountyId}`,
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.consensusEngine,
          abi: consensusEngineAbi,
          eventName: 'ConsensusReached',
          onLogs: (logs) => {
            logs.forEach((log) => {
              push({
                id: `consensus-${log.transactionHash}-${log.logIndex}`,
                type: 'consensus_reached',
                title: 'Consensus reached',
                detail: `Bounty #${log.args.bountyId}`,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                href: `/bounty/${log.args.bountyId}`,
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.resolverRegistry,
          abi: resolverRegistryAbi,
          eventName: 'AgentRegistered',
          onLogs: (logs) => {
            logs.forEach((log) => {
              push({
                id: `agent-${log.transactionHash}-${log.logIndex}`,
                type: 'agent_registered',
                title: 'Resolver registered',
                detail: formatAddress(log.args.agent as Address),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
            });
          },
        }),
      ];
    }

    startWatchers().catch(() => setLoading(false));

    return () => {
      unwatchFns.forEach((fn) => fn());
    };
  }, []);

  return { items, live, loading };
}
