import { cn } from '../../lib/utils/format';
import { BountyStatus, BountyStatusLabel } from '../../lib/utils/bounty';

type BadgeProps = {
  status?: number;
  label?: string;
  variant?: 'status' | 'type' | 'live' | 'consensus';
  className?: string;
};

const statusStyles: Record<number, string> = {
  [BountyStatus.Open]: 'bg-cyan/15 text-cyan border-cyan/30',
  [BountyStatus.Submitted]: 'bg-warning/15 text-warning border-warning/30',
  [BountyStatus.Resolved]: 'bg-success/15 text-success border-success/30',
  [BountyStatus.Unresolved]: 'bg-danger/15 text-danger border-danger/30',
  [BountyStatus.Cancelled]: 'bg-white/5 text-surface-muted border-white/10',
};

export function Badge({ status, label, variant = 'status', className }: BadgeProps) {
  const text =
    label ??
    (status !== undefined ? BountyStatusLabel[status as keyof typeof BountyStatusLabel] : '');

  const style =
    variant === 'type'
      ? 'bg-ice/10 text-ice border-ice/20'
      : variant === 'live'
        ? 'bg-cyan/20 text-cyan border-cyan/40'
        : variant === 'consensus'
          ? 'bg-success/15 text-success border-success/30'
          : status !== undefined
            ? statusStyles[status] ?? statusStyles[BountyStatus.Open]
            : statusStyles[BountyStatus.Open];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide',
        style,
        className,
      )}
    >
      {text}
    </span>
  );
}
