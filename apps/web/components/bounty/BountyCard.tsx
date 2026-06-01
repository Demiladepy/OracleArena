'use client';

import Link from 'next/link';
import { demoConfig } from '@oracle-arena/config';
import type { OnChainBounty } from '../../lib/contracts';
import { bountyTypeLabel } from '../../lib/utils/bounty';
import { formatRelativeDeadline, formatSTT } from '../../lib/utils/format';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { AddressDisplay } from '../ui/AddressDisplay';

export function BountyCard({ bounty }: { bounty: OnChainBounty }) {
  const isFeatured = bounty.id === BigInt(demoConfig.bountyId);
  const isDisagreementDemo = bounty.id === BigInt(demoConfig.legacyDemoBountyId);

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <Card hover accent className="h-full">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge status={bounty.status} />
            {isFeatured ? <Badge variant="live" label="Featured demo" /> : null}
            {isDisagreementDemo ? (
              <Badge variant="consensus" label="Disagreement path" />
            ) : null}
          </div>
          <span className="font-mono text-sm font-medium text-cyan">{formatSTT(bounty.displayPayout)}</span>
        </div>
        <h3 className="font-display text-lg leading-snug text-surface-text line-clamp-3">{bounty.claim}</h3>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-4 text-xs text-surface-muted">
          <AddressDisplay address={bounty.poster} chars={3} />
          <span>{formatRelativeDeadline(bounty.deadline)}</span>
        </div>
        <p className="mt-2 text-xs text-surface-muted">{bountyTypeLabel(bounty.bountyType)}</p>
      </Card>
    </Link>
  );
}
