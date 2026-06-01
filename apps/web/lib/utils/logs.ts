import type { AbiEvent, Address, Log } from 'viem';
import { getLogs } from 'viem/actions';
import { publicClient } from '../viem';

/** Somnia RPC limits eth_getLogs to 1000 blocks per request */
export const LOG_CHUNK_SIZE = 1000n;
export const DEFAULT_LOG_CHUNK_COUNT = 20;

/**
 * Scan historical logs in ≤1000-block chunks (newest first).
 * Stops when `maxChunks` exhausted or `stopWhen` returns true.
 */
export async function getLogsChunked<TAbiEvent extends AbiEvent>(params: {
  address: Address;
  event: TAbiEvent;
  fromBlock?: bigint;
  maxChunks?: number;
  stopWhen?: (logs: Log<bigint, number, false, TAbiEvent>[]) => boolean;
}): Promise<Log<bigint, number, false, TAbiEvent>[]> {
  const latest = await publicClient.getBlockNumber();
  const maxChunks = params.maxChunks ?? DEFAULT_LOG_CHUNK_COUNT;
  const collected: Log<bigint, number, false, TAbiEvent>[] = [];

  for (let i = 0; i < maxChunks; i++) {
    const toBlock = latest - BigInt(i) * LOG_CHUNK_SIZE;
    const fromBlock = toBlock > LOG_CHUNK_SIZE ? toBlock - LOG_CHUNK_SIZE + 1n : 0n;
    if (toBlock < 0n) break;

    try {
      const chunk = await getLogs(publicClient, {
        address: params.address,
        event: params.event,
        fromBlock: params.fromBlock && params.fromBlock > fromBlock ? params.fromBlock : fromBlock,
        toBlock,
      });
      collected.push(...(chunk as Log<bigint, number, false, TAbiEvent>[]));
      if (params.stopWhen?.(collected)) break;
    } catch {
      break;
    }
  }

  return collected;
}
