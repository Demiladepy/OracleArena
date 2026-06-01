import { cn } from '../../lib/utils/format';

export function LiveIndicator({ active = true, className }: { active?: boolean; className?: string }) {
  if (!active) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-50"
          style={{ animationDuration: '2s' }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
      </span>
      Live
    </span>
  );
}
