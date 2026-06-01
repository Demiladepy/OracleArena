export const BountyStatus = {
  Open: 0,
  Submitted: 1,
  Resolved: 2,
  Unresolved: 3,
  Cancelled: 4,
} as const;

export type BountyStatusValue = (typeof BountyStatus)[keyof typeof BountyStatus];

export const BountyStatusLabel: Record<BountyStatusValue, string> = {
  [BountyStatus.Open]: 'Open',
  [BountyStatus.Submitted]: 'Submitted',
  [BountyStatus.Resolved]: 'Resolved',
  [BountyStatus.Unresolved]: 'Unresolved',
  [BountyStatus.Cancelled]: 'Cancelled',
};

export const ConsensusStatus = {
  Pending: 0,
  Agreed: 1,
  Disagreed: 2,
  Unresolved: 3,
} as const;

export type ConsensusStatusValue = (typeof ConsensusStatus)[keyof typeof ConsensusStatus];

export const ConsensusStatusLabel: Record<ConsensusStatusValue, string> = {
  [ConsensusStatus.Pending]: 'Pending',
  [ConsensusStatus.Agreed]: 'Agreed',
  [ConsensusStatus.Disagreed]: 'Disagreed',
  [ConsensusStatus.Unresolved]: 'Unresolved',
};

export const BOUNTY_TYPE_LABELS: Record<string, string> = {
  URL_RESOLVABLE_FACT: 'URL-resolvable fact',
};

export function bountyTypeLabel(typeHash: `0x${string}`): string {
  return BOUNTY_TYPE_LABELS.URL_RESOLVABLE_FACT ?? truncateType(typeHash);
}

function truncateType(hash: string): string {
  return `${hash.slice(0, 10)}…`;
}

export function isActiveBountyStatus(status: number): boolean {
  return status === BountyStatus.Open || status === BountyStatus.Submitted;
}
