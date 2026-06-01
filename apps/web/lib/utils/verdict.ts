import {
  CANONICAL_VERDICT_LABELS,
  VERDICT_HASH_FALSE,
  VERDICT_HASH_TRUE,
} from '@oracle-arena/types';

export { VERDICT_HASH_TRUE, VERDICT_HASH_FALSE, CANONICAL_VERDICT_LABELS };

export type VerdictDisplay = {
  label: string;
  encoding: 'canonical' | 'raw-string' | 'unknown';
};

/** Decode bytes32 verdict for UI — prefer human labels over raw hex */
export function formatVerdict(verdictHash: `0x${string}`): VerdictDisplay {
  const lower = verdictHash.toLowerCase() as `0x${string}`;

  if (lower === VERDICT_HASH_TRUE.toLowerCase()) {
    return { label: CANONICAL_VERDICT_LABELS[VERDICT_HASH_TRUE], encoding: 'canonical' };
  }
  if (lower === VERDICT_HASH_FALSE.toLowerCase()) {
    return { label: CANONICAL_VERDICT_LABELS[VERDICT_HASH_FALSE], encoding: 'canonical' };
  }

  const raw = decodeRawBytes32String(verdictHash);
  if (raw) {
    return { label: raw, encoding: 'raw-string' };
  }

  return { label: `${verdictHash.slice(0, 10)}…${verdictHash.slice(-6)}`, encoding: 'unknown' };
}

export function formatVerdictWithConfidence(
  verdictHash: `0x${string}`,
  confidenceBps: number,
): string {
  const { label } = formatVerdict(verdictHash);
  const pct = (confidenceBps / 100).toFixed(1);
  return `${label} · ${pct}% confidence`;
}

function decodeRawBytes32String(hash: `0x${string}`): string | null {
  try {
    const hex = hash.slice(2);
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.slice(i, i + 2), 16);
      if (byte === 0) break;
      if (byte < 32 || byte > 126) return null;
      bytes.push(byte);
    }
    if (bytes.length === 0) return null;
    const text = String.fromCharCode(...bytes);
    return text.length >= 2 ? text : null;
  } catch {
    return null;
  }
}
