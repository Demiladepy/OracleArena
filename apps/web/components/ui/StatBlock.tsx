import { cn } from '../../lib/utils/format';

type StatBlockProps = {
  label: string;
  value: string;
  sub?: string;
  className?: string;
};

export function StatBlock({ label, value, sub, className }: StatBlockProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-surface-muted sm:text-xs">
        {label}
      </span>
      <span className="font-display text-xl font-semibold tabular-nums text-surface-text sm:text-2xl md:text-3xl">
        {value}
      </span>
      {sub ? <span className="text-xs text-surface-muted">{sub}</span> : null}
    </div>
  );
}
