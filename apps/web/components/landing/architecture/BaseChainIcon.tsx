'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

export const BaseChainIcon = forwardRef<HTMLDivElement, { className?: string }>(
  function BaseChainIcon({ className }, ref) {
    return (
      <div ref={ref} className={cn('text-center will-change-transform', className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-cyan/40 bg-[var(--bg-card)] font-bold text-cyan neon-glow">
          BASE
        </div>
        <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-[var(--text-dim)]">
          Cross-chain payout
        </p>
      </div>
    );
  },
);
