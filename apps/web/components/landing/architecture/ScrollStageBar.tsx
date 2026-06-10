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

/** In-flow scroll progress — sits below the diagram, not overlaid on content */
export function ScrollStageBar({ activeIndex, progress, onSkip }: Props) {
  const clampedIndex = Math.min(Math.max(activeIndex, 0), STAGES.length - 1);

  return (
    <div className="mx-auto mt-8 w-full max-w-lg border-t border-white/10 pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
          <span className="text-white">{STAGES[clampedIndex]}</span>
          <span className="mx-2 text-white/25">·</span>
          <span>
            {clampedIndex + 1}/{STAGES.length}
          </span>
        </p>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="focus-ring shrink-0 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-white"
          >
            Skip
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-px w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--purple-accent)]/80 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

export { STAGES };
