'use client';

import { forwardRef } from 'react';
import { cn } from '../../../lib/utils/format';

type Props = {
  label: string;
  address: string;
  className?: string;
};

export const AgentPod = forwardRef<HTMLDivElement, Props>(function AgentPod(
  { label, address, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'w-[140px] rounded-xl border border-cyan/60 bg-[var(--bg-card)] px-3 py-3 text-center neon-glow will-change-transform',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan">{label}</p>
      <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{address}</p>
    </div>
  );
});
