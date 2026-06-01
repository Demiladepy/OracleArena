'use client';

import { useEffect, useRef, useState } from 'react';
import { type Address } from 'viem';
import { watchContractEvent } from 'viem/actions';
import { publicClient } from '../viem';
import {
  addresses,
  bountyBoardAbi,
  consensusEngineAbi,
  mockLiFiRouterAbi,
  settlementAbi,
  type AgentRecord,
  type OnChainSubmission,
} from '../contracts';
import {
  fetchAgent,
  fetchAgentsForType,
  fetchBounty,
  fetchConsensusStatus,
  fetchConsensusSubmissions,
} from '../contracts/bountyBoard';
import { ConsensusStatus, ConsensusStatusLabel } from '../utils/bounty';
import { formatAddress, formatSTT } from '../utils/format';
import { formatVerdictWithConfidence } from '../utils/verdict';
import { fetchHistoricalRaceEvents } from '../contracts/raceHistory';

export type RaceEvent = {
  id: string;
  kind:
    | 'posted'
    | 'agents_notified'
    | 'submission'
    | 'consensus'
    | 'consensus_failed'
    | 'settlement'
    | 'payout_queued'
    | 'payout_forwarded'
    | 'bridge';
  label: string;
  detail?: string;
  timestamp: bigint;
  meta?: Record<string, string>;
};

export function useRaceTimeline(bountyId: bigint) {
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [submissions, setSubmissions] = useState<OnChainSubmission[]>([]);
  const [consensusStatus, setConsensusStatus] = useState<number>(0);
  const [live, setLive] = useState(false);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let unwatchFns: (() => void)[] = [];
    seen.current.clear();
    setEvents([]);
    setLive(false);

    function add(event: RaceEvent) {
      if (seen.current.has(event.id)) return;
      seen.current.add(event.id);
      setEvents((prev) =>
        [...prev, event].sort((a, b) => Number(a.timestamp - b.timestamp)),
      );
    }

    async function bootstrap() {
      const bounty = await fetchBounty(bountyId);
      const [subs, status, eligibleAgents] = await Promise.all([
        fetchConsensusSubmissions(bountyId),
        fetchConsensusStatus(bountyId),
        fetchAgentsForType(bounty.bountyType),
      ]);

      setSubmissions(subs);
      setConsensusStatus(status);

      const agentRecords = (
        await Promise.all(eligibleAgents.map((a) => fetchAgent(a)))
      ).filter((a): a is AgentRecord => a !== null);
      setAgents(agentRecords);

      add({
        id: `posted-${bountyId}`,
        kind: 'posted',
        label: 'Bounty posted',
        detail: bounty.claim,
        timestamp: bounty.createdAt,
        meta: { poster: bounty.poster, payout: formatSTT(bounty.displayPayout) },
      });

      if (agentRecords.length > 0) {
        add({
          id: `agents-${bountyId}`,
          kind: 'agents_notified',
          label: `${agentRecords.length} resolver${agentRecords.length > 1 ? 's' : ''} eligible`,
          detail: agentRecords.map((a) => formatAddress(a.agentAddress)).join(', '),
          timestamp: bounty.createdAt + 1n,
        });
      }

      subs.forEach((sub, i) => {
        add({
          id: `sub-${sub.resolver}-${i}`,
          kind: 'submission',
          label: `${formatAddress(sub.resolver)} submitted verdict`,
          detail: formatVerdictWithConfidence(sub.verdictHash, sub.confidence),
          timestamp: sub.submittedAt,
          meta: { evidenceUri: sub.evidenceUri },
        });
      });

      const historical = await fetchHistoricalRaceEvents(bountyId, status);
      historical.forEach((event) => add(event));

      if (status === ConsensusStatus.Agreed) {
        add({
          id: `consensus-agreed-${bountyId}`,
          kind: 'consensus',
          label: 'Consensus agreed',
          detail: ConsensusStatusLabel[status as keyof typeof ConsensusStatusLabel],
          timestamp: bounty.resolvedAt || subs[subs.length - 1]?.submittedAt || bounty.createdAt,
        });
      } else if (status === ConsensusStatus.Disagreed) {
        add({
          id: `consensus-disagreed-${bountyId}`,
          kind: 'consensus_failed',
          label: 'Consensus disagreed',
          detail: 'Verdicts did not match',
          timestamp: bounty.resolvedAt || bounty.deadline,
        });
      }

      setLive(true);

      unwatchFns = [
        watchContractEvent(publicClient, {
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          eventName: 'SubmissionRecorded',
          args: { bountyId },
          onLogs: (logs) => {
            logs.forEach((log) => {
              add({
                id: `live-sub-${log.transactionHash}`,
                kind: 'submission',
                label: `${formatAddress(log.args.resolver as Address)} submitted verdict`,
                detail: formatVerdictWithConfidence(
                  log.args.verdictHash as `0x${string}`,
                  Number(log.args.confidence),
                ),
                timestamp: log.args.submittedAt as bigint,
                meta: { evidenceUri: String(log.args.evidenceUri) },
              });
              setSubmissions((prev) => {
                const exists = prev.some((s) => s.resolver === log.args.resolver);
                if (exists) return prev;
                return [
                  ...prev,
                  {
                    resolver: log.args.resolver as Address,
                    verdictHash: log.args.verdictHash as `0x${string}`,
                    confidence: Number(log.args.confidence),
                    evidenceUri: String(log.args.evidenceUri),
                    submittedAt: log.args.submittedAt as bigint,
                  },
                ];
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.consensusEngine,
          abi: consensusEngineAbi,
          eventName: 'ConsensusReached',
          args: { bountyId },
          onLogs: (logs) => {
            logs.forEach((log) => {
              add({
                id: `live-consensus-${log.transactionHash}`,
                kind: 'consensus',
                label: 'Consensus reached',
                detail: formatVerdictWithConfidence(
                  log.args.winningHash as `0x${string}`,
                  9000,
                ),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
              setConsensusStatus(ConsensusStatus.Agreed);
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.consensusEngine,
          abi: consensusEngineAbi,
          eventName: 'ConsensusFailed',
          args: { bountyId },
          onLogs: (logs) => {
            logs.forEach((log) => {
              add({
                id: `live-failed-${log.transactionHash}`,
                kind: 'consensus_failed',
                label: 'Consensus failed',
                detail: String(log.args.reason),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          eventName: 'BountySettled',
          args: { bountyId },
          onLogs: (logs) => {
            logs.forEach((log) => {
              add({
                id: `settled-${log.transactionHash}`,
                kind: 'settlement',
                label: 'Bounty settled on-chain',
                detail: `Fee ${formatSTT(log.args.feeAmount as bigint)}`,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.settlement,
          abi: settlementAbi,
          eventName: 'PayoutQueued',
          onLogs: (logs) => {
            logs.forEach((log) => {
              if (log.args.bountyId !== bountyId) return;
              add({
                id: `queued-${log.transactionHash}`,
                kind: 'payout_queued',
                label: 'Payout queued',
                detail: `${formatAddress(log.args.resolver as Address)} · ${formatSTT(log.args.amount as bigint)}`,
                timestamp: log.args.queuedAt as bigint,
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.settlement,
          abi: settlementAbi,
          eventName: 'PayoutForwarded',
          onLogs: (logs) => {
            logs.forEach((log) => {
              if (log.args.bountyId !== bountyId) return;
              add({
                id: `forward-${log.transactionHash}`,
                kind: 'payout_forwarded',
                label: 'Cross-chain payout forwarded',
                detail: `Chain ${log.args.destinationChain} · ${formatSTT(log.args.amount as bigint)}`,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
            });
          },
        }),
        watchContractEvent(publicClient, {
          address: addresses.mockLiFiRouter,
          abi: mockLiFiRouterAbi,
          eventName: 'MockBridgeRequest',
          onLogs: (logs) => {
            logs.forEach((log) => {
              add({
                id: `bridge-${log.transactionHash}`,
                kind: 'bridge',
                label: 'LiFi mock bridge request',
                detail: `${formatSTT(log.args.amount as bigint)} → chain ${log.args.destinationChain}`,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
              });
            });
          },
        }),
      ];
    }

    bootstrap().catch(console.error);

    return () => {
      unwatchFns.forEach((fn) => fn());
    };
  }, [bountyId]);

  return { events, agents, submissions, consensusStatus, live };
}
