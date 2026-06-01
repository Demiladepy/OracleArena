import { type Address, formatEther, formatUnits, type Hash } from 'viem';
import { EXPLORER_URL } from '../chains';

export function formatAddress(address: Address | string, chars = 4): string {
  const a = address.toLowerCase();
  if (a.length < 10) return a;
  return `${a.slice(0, 2 + chars)}…${a.slice(-chars)}`;
}

/** Format wei as STT — uses formatEther and trims trailing zeros */
export function formatSTT(wei: bigint, maxDecimals = 4): string {
  if (wei === 0n) return '0 STT';

  const ether = formatEther(wei);
  const [whole, frac = ''] = ether.split('.');
  if (!frac || /^0+$/.test(frac)) return `${whole} STT`;

  const trimmed = frac.replace(/0+$/, '').slice(0, maxDecimals);
  if (!trimmed) return `${whole} STT`;
  return `${whole}.${trimmed} STT`;
}

/** Bond / earnings: compact STT without losing small values */
export function formatSTTCompact(wei: bigint): string {
  return formatSTT(wei, 6);
}

export function formatDeadline(timestamp: bigint | number): string {
  const ms = Number(timestamp) * 1000;
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDeadline(timestamp: bigint | number): string {
  const diff = Number(timestamp) * 1000 - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function formatConfidence(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function formatWinRate(attempted: bigint, agreed: bigint): string {
  if (attempted === 0n) return '—';
  return `${((Number(agreed) / Number(attempted)) * 100).toFixed(1)}%`;
}

export function explorerAddress(address: Address | string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

export function explorerTx(hash: Hash | string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function truncateHash(hash: Hash | string, chars = 6): string {
  return `${hash.slice(0, 2 + chars)}…${hash.slice(-chars)}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
