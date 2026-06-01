'use client';

import { useEffect, useState } from 'react';
import { type Address, parseAbiItem } from 'viem';
import { watchContractEvent } from 'viem/actions';
import { publicClient } from '../viem';
import {
  addresses,
  resolverPayoutPrefsAbi,
  resolverRegistryAbi,
  type AgentRecord,
  type PayoutPrefRecord,
} from '../contracts';
import { fetchAgent } from '../contracts/bountyBoard';
import { formatWinRate } from '../utils/format';
import { getLogsChunked } from '../utils/logs';
import { PayoutMode } from '@oracle-arena/types';
import { formatChainId } from '../utils/chains';

export type LeaderboardRow = {
  agent: Address;
  operator: Address;
  bond: bigint;
  attempted: bigint;
  agreed: bigint;
  winRateLabel: string;
  winRateSort: number;
  earnings: bigint;
  typeTags: readonly `0x${string}`[];
  payoutLabel: string;
};

const agentRegisteredEvent = parseAbiItem(
  'event AgentRegistered(address indexed agent, address indexed operator, bytes32[] typeTags, uint256 bond, uint64 registeredAt)',
);

function payoutPrefLabel(pref: PayoutPrefRecord): string {
  if (pref.mode === PayoutMode.CrossChain) {
    return `CrossChain → ${formatChainId(pref.destinationChain)}`;
  }
  return 'Native STT';
}

async function fetchPreference(agent: Address): Promise<PayoutPrefRecord> {
  return publicClient.readContract({
    address: addresses.resolverPayoutPrefs,
    abi: resolverPayoutPrefsAbi,
    functionName: 'getPreference',
    args: [agent],
  }) as Promise<PayoutPrefRecord>;
}

function rowFromAgent(agent: AgentRecord, pref: PayoutPrefRecord): LeaderboardRow {
  const { reputation } = agent;
  const attempted = BigInt(reputation.resolutionsAttempted);
  const agreed = BigInt(reputation.resolutionsAgreed);
  const winRateSort =
    attempted === 0n ? -1 : Number((agreed * 10000n) / attempted);

  return {
    agent: agent.agentAddress,
    operator: agent.operator,
    bond: agent.bond,
    attempted,
    agreed,
    winRateLabel: formatWinRate(reputation.resolutionsAttempted, reputation.resolutionsAgreed),
    winRateSort,
    earnings: reputation.totalEarnings,
    typeTags: agent.typeTags,
    payoutLabel: payoutPrefLabel(pref),
  };
}

async function loadLeaderboard(): Promise<LeaderboardRow[]> {
  const registered = await getLogsChunked({
    address: addresses.resolverRegistry,
    event: agentRegisteredEvent,
    maxChunks: 30,
  });

  const agentSet = new Set<string>();
  for (const log of registered) {
    const agent = log.args.agent as Address;
    if (agent) agentSet.add(agent.toLowerCase());
  }

  // MVP fallback: known demo agents if log scan returns empty
  if (agentSet.size === 0) {
    agentSet.add(addresses.resolverAgentA.toLowerCase());
    agentSet.add(addresses.resolverAgentB.toLowerCase());
  }

  const rows = await Promise.all(
    [...agentSet].map(async (key) => {
      const agentAddr = `0x${key.slice(2)}` as Address;
      const agent = await fetchAgent(agentAddr);
      if (!agent) return null;
      const pref = await fetchPreference(agentAddr);
      return rowFromAgent(agent, pref);
    }),
  );

  return rows
    .filter((r): r is LeaderboardRow => r !== null)
    .sort((a, b) => b.winRateSort - a.winRateSort);
}

export function useLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    async function refresh() {
      try {
        const data = await loadLeaderboard();
        setRows(data);
        setLive(true);
      } finally {
        setLoading(false);
      }
    }

    refresh();

    const unwatch = watchContractEvent(publicClient, {
      address: addresses.resolverRegistry,
      abi: resolverRegistryAbi,
      eventName: 'AgentRegistered',
      onLogs: () => {
        refresh();
      },
    });

    const interval = setInterval(refresh, 20000);
    return () => {
      unwatch?.();
      clearInterval(interval);
    };
  }, []);

  return { rows, loading, live };
}
