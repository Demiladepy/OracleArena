'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

export const EvidenceChip = forwardRef<HTMLDivElement, { domain: string; className?: string }>(
  function EvidenceChip({ domain, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-[var(--bg-elevated)] px-2 py-1.5 text-[10px] text-[var(--text-muted)] will-change-transform',
          className,
        )}
      >
        <span className="text-cyan" aria-hidden>
          🔗
        </span>
        <span className="truncate font-mono">{domain}</span>
      </div>
    );
  },
);
