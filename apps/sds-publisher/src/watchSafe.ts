import type { Abi, Address } from 'viem';
import type { createPublicClient } from 'viem';
import { watchContractEvent } from 'viem/actions';
import { recordPublisherError } from './health.js';

type PublicClient = ReturnType<typeof createPublicClient>;

/** viem decoded event logs — typed loosely to match watchContractEvent payloads */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WatchLog = any;

type WatchConfig<TAbi extends Abi> = {
  address: Address;
  abi: TAbi;
  eventName: string;
  onLogs: (logs: WatchLog[]) => void | Promise<void>;
};

export function watchSafe<TAbi extends Abi>(client: PublicClient, config: WatchConfig<TAbi>) {
  const { eventName, onLogs, ...rest } = config;

  watchContractEvent(client, {
    ...rest,
    onLogs: async (logs) => {
      try {
        await onLogs(logs);
      } catch (error) {
        console.error(`[watch] ${eventName} handler error (continuing):`, error);
        recordPublisherError(String(error));
      }
    },
    onError: (error) => {
      console.error(`[watch] ${eventName} subscription error:`, error);
      recordPublisherError(String(error));
    },
  });
}
