/** LI.FI bridge integration types — adapter wraps configurable router (LiFiDiamond mainnet / MockLiFiRouter testnet) */

export interface LiFiBridgeData {
  transactionId: `0x${string}`;
  bridge: string;
  integrator: string;
  referrer: `0x${string}`;
  sendingAssetId: `0x${string}`;
  receiver: `0x${string}`;
  minAmount: bigint;
  destinationChainId: bigint;
  hasSourceSwaps: boolean;
  hasDestinationCall: boolean;
}

export interface BridgeInitiatedEvent {
  resolver: `0x${string}`;
  destinationChain: number;
  destinationAsset: `0x${string}`;
  destinationRecipient: `0x${string}`;
  amount: bigint;
}

export interface MockBridgeRequestEvent {
  id: bigint;
  sender: `0x${string}`;
  amount: bigint;
  destinationChain: number;
  destinationAsset: `0x${string}`;
  destinationRecipient: `0x${string}`;
}

/** Mainnet LiFiDiamond — update when deploying to Somnia mainnet */
export const LIFI_MAINNET_DIAMOND = '' as `0x${string}` | '';

/** Testnet uses MockLiFiRouter deployed alongside LiFiAdapter */
export const LIFI_TESTNET_USES_MOCK = true as const;
