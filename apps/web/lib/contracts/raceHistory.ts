import { type Address, type Hash } from 'viem';
import { getContractEvents } from 'viem/actions';
import { demoConfig } from '@oracle-arena/config';
import { publicClient } from '../viem';
import {
  addresses,
  bountyBoardAbi,
  consensusEngineAbi,
  mockLiFiRouterAbi,
  settlementAbi,
} from '../contracts';
import { ConsensusStatus } from '../utils/bounty';
import { formatAddress, formatSTT } from '../utils/format';
import { formatChainId, formatDestinationAsset } from '../utils/chains';
import { formatVerdictWithConfidence } from '../utils/verdict';
import type { RaceEvent } from '../hooks/useRaceTimeline';

/** Approximate BountyBoard v3 deploy block — avoids full-chain log scans */
const LOG_FROM_BLOCK = 396_900_000n;

const EXPLORER = 'https://shannon-explorer.somnia.network/tx';

/** Documented live txs — real on-chain, used when RPC log range is limited */
const CANONICAL_TX_BY_BOUNTY: Record<string, Partial<Record<RaceEvent['kind'], Hash>>> = {
  '4': {
    settlement: '0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66',
    payout_queued: '0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66',
    payout_forwarded: '0x5a5f18eb2dfe09f8179783c59b7852350f1c64ad8cbb219ba3ae2a20f16c70fb',
    bridge: '0x5a5f18eb2dfe09f8179783c59b7852350f1c64ad8cbb219ba3ae2a20f16c70fb',
    consensus: '0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66',
  },
  '1': {
    consensus_failed: '0x6e53c7b0ddb42e0f70ee41e62061eea341684d39f66e7e8efb8ca354394caf10',
  },
};

function txMeta(hash: Hash | undefined): Record<string, string> | undefined {
  if (!hash) return undefined;
  return { txHash: hash, explorer: `${EXPLORER}/${hash}` };
}

export async function fetchHistoricalRaceEvents(
  bountyId: bigint,
  status: number,
): Promise<RaceEvent[]> {
  const events: RaceEvent[] = [];
  const id = bountyId.toString();
  const canonical = CANONICAL_TX_BY_BOUNTY[id];

  try {
    const [settled, consensusReached, consensusFailed, unresolved, queued, forwarded, bridge] =
      await Promise.all([
        getContractEvents(publicClient, {
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          eventName: 'BountySettled',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.consensusEngine,
          abi: consensusEngineAbi,
          eventName: 'ConsensusReached',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.consensusEngine,
          abi: consensusEngineAbi,
          eventName: 'ConsensusFailed',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.bountyBoard,
          abi: bountyBoardAbi,
          eventName: 'BountyUnresolved',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.settlement,
          abi: settlementAbi,
          eventName: 'PayoutQueued',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.settlement,
          abi: settlementAbi,
          eventName: 'PayoutForwarded',
          args: { bountyId },
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
        getContractEvents(publicClient, {
          address: addresses.mockLiFiRouter,
          abi: mockLiFiRouterAbi,
          eventName: 'MockBridgeRequest',
          fromBlock: LOG_FROM_BLOCK,
        }).catch(() => []),
      ]);

    settled.forEach((log) => {
      events.push({
        id: `hist-settled-${log.transactionHash}`,
        kind: 'settlement',
        label: 'Bounty settled on-chain',
        detail: `Protocol fee ${formatSTT(log.args.feeAmount as bigint)}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    consensusReached.forEach((log) => {
      events.push({
        id: `hist-consensus-${log.transactionHash}`,
        kind: 'consensus',
        label: 'Consensus reached — Agreed',
        detail: formatVerdictWithConfidence(
          log.args.winningHash as `0x${string}`,
          9000,
        ),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    consensusFailed.forEach((log) => {
      events.push({
        id: `hist-failed-${log.transactionHash}`,
        kind: 'consensus_failed',
        label: 'Consensus disagreed',
        detail: String(log.args.reason),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    unresolved.forEach((log) => {
      events.push({
        id: `hist-unresolved-${log.transactionHash}`,
        kind: 'consensus_failed',
        label: 'Bounty marked unresolved',
        detail: `Refunded ${formatSTT(log.args.refundedToPoster as bigint)} to poster`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    queued.forEach((log) => {
      events.push({
        id: `hist-queued-${log.transactionHash}`,
        kind: 'payout_queued',
        label: 'CrossChain payout queued (Agent A)',
        detail: `${formatAddress(log.args.resolver as Address)} · ${formatSTT(log.args.amount as bigint)}`,
        timestamp: (log.args.queuedAt as bigint) ?? BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    forwarded.forEach((log) => {
      events.push({
        id: `hist-forward-${log.transactionHash}`,
        kind: 'payout_forwarded',
        label: 'Payout forwarded via LiFiAdapter',
        detail: `${formatChainId(log.args.destinationChain as number)} · ${formatSTT(log.args.amount as bigint)}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });

    bridge.forEach((log) => {
      events.push({
        id: `hist-bridge-${log.transactionHash}`,
        kind: 'bridge',
        label: 'MockBridgeRequest — cross-chain initiated',
        detail: `${formatSTT(log.args.amount as bigint)} → ${formatChainId(log.args.destinationChain as number)} · ${formatDestinationAsset(log.args.destinationAsset as Address)}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(log.transactionHash),
      });
    });
  } catch {
    // fall through to canonical supplement
  }

  if (events.length === 0 && canonical && status === ConsensusStatus.Agreed) {
    if (canonical.consensus) {
      events.push({
        id: `canon-consensus-${id}`,
        kind: 'consensus',
        label: 'Consensus reached — Agreed',
        detail: 'Canonical demo — see Shannon explorer',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(canonical.consensus),
      });
    }
    if (canonical.payout_queued) {
      events.push({
        id: `canon-queued-${id}`,
        kind: 'payout_queued',
        label: 'CrossChain payout queued (Agent A)',
        detail: '0.1176 STT at Settlement',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(canonical.payout_queued),
      });
    }
    if (canonical.payout_forwarded) {
      events.push({
        id: `canon-forward-${id}`,
        kind: 'payout_forwarded',
        label: 'Payout forwarded via LiFiAdapter',
        detail: 'Base (8453)',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(canonical.payout_forwarded),
      });
    }
    if (canonical.bridge) {
      events.push({
        id: `canon-bridge-${id}`,
        kind: 'bridge',
        label: 'MockBridgeRequest — cross-chain initiated',
        detail: 'Canonical demo chain complete',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(canonical.bridge),
      });
    }
  }

  if (
    events.every((e) => e.kind !== 'consensus_failed') &&
    canonical?.consensus_failed &&
    status === ConsensusStatus.Disagreed
  ) {
    events.push({
      id: `canon-failed-${id}`,
      kind: 'consensus_failed',
      label: 'Consensus disagreed',
      detail: 'Verdict hash encoding mismatch (Bounty #1 demo)',
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      meta: txMeta(canonical.consensus_failed),
    });
  }

  if (bountyId === BigInt(demoConfig.bountyId) && status === ConsensusStatus.Agreed) {
    const kinds = new Set(events.map((e) => e.kind));
    if (!kinds.has('bridge') && canonical?.bridge) {
      events.push({
        id: `canon-bridge-fallback-${id}`,
        kind: 'bridge',
        label: 'MockBridgeRequest — cross-chain initiated',
        detail: 'Documented live tx',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        meta: txMeta(canonical.bridge),
      });
    }
  }

  return events;
}
