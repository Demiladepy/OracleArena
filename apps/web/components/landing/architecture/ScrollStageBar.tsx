const STAGES = [
  'Bounty posted',
  'Agents assigned',
  'Evidence gathered',
  'Verdicts submitted',
  'Consensus reached',
  'Cross-chain payout',
] as const;

type Props = {
  activeIndex: number;
  progress: number;
  onSkip?: () => void;
};

export function ScrollStageBar({ activeIndex, progress, onSkip }: Props) {
  const clampedIndex = Math.min(Math.max(activeIndex, 0), STAGES.length - 1);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3 px-4 md:bottom-8">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3">
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--purple-accent)] transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="focus-ring shrink-0 rounded border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:border-white/30 hover:text-white"
          >
            Skip
          </button>
        ) : null}
      </div>
      <p className="text-center text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
        <span className="text-white">{STAGES[clampedIndex]}</span>
        <span className="mx-2 text-white/25">·</span>
        <span>
          {clampedIndex + 1}/{STAGES.length}
        </span>
      </p>
    </div>
  );
}

export { STAGES };
