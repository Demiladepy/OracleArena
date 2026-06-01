/** Canonical keccak256 verdict hashes — used by synced resolver agents (Bounty #4+) */
export const VERDICT_HASH_TRUE =
  '0x6273151f959616268004b58dbb21e5c851b7b8d04498b4aabee12291d22fc034' as const;

export const VERDICT_HASH_FALSE =
  '0xba9154e0baa69c78e0ca563b867df81bae9d177c4ea1452c35c84386a70f0f7a' as const;

/** keccak256("The claim is false.") — Agent A, Bounty #1 (raw-string encoding era) */
export const VERDICT_HASH_CLAIM_FALSE_RAW =
  '0x54686520636c61696d2069732066616c73652e000000000000000000000000000000' as const;

export const CANONICAL_VERDICT_LABELS = {
  [VERDICT_HASH_TRUE]: 'Yes — claim is true',
  [VERDICT_HASH_FALSE]: 'No — claim is false',
} as const;

export type CanonicalVerdictHash = typeof VERDICT_HASH_TRUE | typeof VERDICT_HASH_FALSE;
