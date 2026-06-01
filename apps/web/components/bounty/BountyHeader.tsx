'use client';

import { useEffect, useState } from 'react';
import type { OnChainBounty } from '../../lib/contracts';
import { bountyTypeLabel } from '../../lib/utils/bounty';
import { formatRelativeDeadline, formatSTT } from '../../lib/utils/format';
import { Badge } from '../ui/Badge';
import { AddressDisplay } from '../ui/AddressDisplay';

export function CountdownTimer({ deadline }: { deadline: bigint }) {
  const [label, setLabel] = useState(formatRelativeDeadline(deadline));

  useEffect(() => {
    const tick = () => setLabel(formatRelativeDeadline(deadline));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [deadline]);

  const expired = Number(deadline) * 1000 <= Date.now();

  return (
    <span className={expired ? 'text-danger' : 'text-cyan'}>{label}</span>
  );
}

export function BountyHeader({ bounty }: { bounty: OnChainBounty }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge status={bounty.status} />
        <Badge variant="type" label={bountyTypeLabel(bounty.bountyType)} />
        <span className="font-mono text-lg font-semibold text-cyan">{formatSTT(bounty.displayPayout)}</span>
      </div>
      <h1 className="font-display text-3xl leading-tight text-surface-text md:text-4xl text-balance">
        {bounty.claim}
      </h1>
      <div className="flex flex-wrap gap-6 text-sm text-surface-muted">
        <div>
          <span className="block text-xs uppercase tracking-widest">Deadline</span>
          <CountdownTimer deadline={bounty.deadline} />
        </div>
        <div>
          <span className="block text-xs uppercase tracking-widest">Posted by</span>
          <AddressDisplay address={bounty.poster} />
        </div>
        <div>
          <span className="block text-xs uppercase tracking-widest">Bounty ID</span>
          <span className="font-mono text-surface-text">#{bounty.id.toString()}</span>
        </div>
      </div>
    </div>
  );
}
