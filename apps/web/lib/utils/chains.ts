import type { Address } from 'viem';
import { formatAddress } from './format';

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  50312: 'Somnia Testnet',
};

export function formatChainId(chainId: number | bigint | undefined): string {
  if (chainId === undefined) return 'Unknown chain';
  const id = Number(chainId);
  return CHAIN_NAMES[id] ?? `Chain ${id}`;
}

export function formatDestinationAsset(asset: Address | string | undefined): string {
  if (!asset || asset === '0x0000000000000000000000000000000000000000') {
    return 'Native STT';
  }
  return formatAddress(asset, 4);
}
