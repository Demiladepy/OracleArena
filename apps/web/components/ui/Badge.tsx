import { BountyStatus, BountyStatusLabel } from '../../lib/utils/bounty';
import { SomniaPill } from '../shared/SomniaPill';

type BadgeProps = {
  status?: number;
  label?: string;
  variant?: 'status' | 'type' | 'live' | 'consensus';
  className?: string;
};

const statusDots = {
  [BountyStatus.Open]: 'cyan' as const,
  [BountyStatus.Submitted]: 'pink' as const,
  [BountyStatus.Resolved]: 'green' as const,
  [BountyStatus.Unresolved]: 'muted' as const,
  [BountyStatus.Cancelled]: 'muted' as const,
};

export function Badge({ status, label, variant = 'status', className }: BadgeProps) {
  const text =
    label ??
    (status !== undefined ? BountyStatusLabel[status as keyof typeof BountyStatusLabel] : '');

  if (variant === 'live') {
    return <SomniaPill label={text || 'Live'} dot="green" className={className} />;
  }

  if (variant === 'consensus') {
    return <SomniaPill label={text || 'Consensus'} dot="purple" className={className} />;
  }

  if (variant === 'type') {
    return <SomniaPill label={text} dot="white" className={className} />;
  }

  const dot = status !== undefined ? statusDots[status as keyof typeof statusDots] ?? 'white' : 'white';

  return <SomniaPill label={text} dot={dot} className={className} />;
}
