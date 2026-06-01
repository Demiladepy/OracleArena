'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

export const ConsensusBadge = forwardRef<HTMLDivElement, { className?: string }>(
  function ConsensusBadge({ className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full border-2 border-success bg-success/10 text-center text-xs font-bold uppercase tracking-wide text-success neon-glow-success will-change-transform',
          className,
        )}
      >
        ✓ Consensus
      </div>
    );
  },
);
