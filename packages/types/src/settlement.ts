export const PayoutMode = {
  SomniaNative: 0,
  CrossChain: 1,
} as const;

export type PayoutMode = (typeof PayoutMode)[keyof typeof PayoutMode];

export interface PayoutPref {
  mode: PayoutMode;
  destinationChain: number;
  destinationAsset: `0x${string}`;
  destinationRecipient: `0x${string}`;
}

export interface PayoutQueuedEvent {
  bountyId: bigint;
  resolver: `0x${string}`;
  amount: bigint;
  queuedAt: bigint;
}

export interface PayoutForwardedEvent {
  bountyId: bigint;
  resolver: `0x${string}`;
  amount: bigint;
  destinationChain: number;
  destinationAsset: `0x${string}`;
}

export interface PayoutRescuedEvent {
  bountyId: bigint;
  resolver: `0x${string}`;
  amount: bigint;
  operator: `0x${string}`;
}

export const SETTLEMENT_RESCUE_DELAY_SECONDS = 24 * 60 * 60;
