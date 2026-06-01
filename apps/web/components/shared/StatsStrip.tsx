'use client';

import { useMarketStats } from '../../lib/hooks/useMarketStats';
import { formatSTT } from '../../lib/utils/format';
import { StatBlock } from '../ui/StatBlock';
import { Skeleton } from '../ui/Skeleton';

export function StatsStrip() {
  const stats = useMarketStats();

  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
      <StatBlock label="Total bounties" value={String(stats.totalBounties)} />
      <StatBlock label="Active resolvers" value={String(stats.totalResolvers)} />
      <StatBlock label="Resolved" value={String(stats.totalResolved)} />
      <StatBlock
        label="Volume settled"
        value={formatSTT(stats.totalVolume)}
        sub={stats.sdsLoaded ? `SDS: ${stats.sdsStats.settlements.toString()} settlement records` : undefined}
      />
    </div>
  );
}
