'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

type Props = {
  className?: string;
  success?: boolean;
};

export const BountyPod = forwardRef<HTMLDivElement, Props>(function BountyPod(
  { className, success },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'w-[200px] rounded-2xl border-2 bg-[var(--bg-card)] px-4 py-4 text-center will-change-transform',
        success ? 'border-success neon-glow-success' : 'border-cyan neon-glow',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan">Bounty #4</p>
      <p className="mt-2 text-sm leading-snug text-[var(--text)]">
        Is the chemical formula for water H₂O?
      </p>
      <p className="mt-2 font-mono text-sm font-medium text-cyan">0.2 STT</p>
    </div>
  );
});
