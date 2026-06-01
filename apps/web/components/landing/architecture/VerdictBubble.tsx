'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

export const VerdictBubble = forwardRef<HTMLDivElement, { className?: string }>(
  function VerdictBubble({ className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-full border border-cyan/50 bg-[var(--bg-card)] px-3 py-2 text-center text-[10px] font-semibold text-cyan neon-glow will-change-transform',
          className,
        )}
      >
        VERDICT: TRUE @ 90%
      </div>
    );
  },
);
