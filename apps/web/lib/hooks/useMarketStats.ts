'use client';

import { useEffect, useState } from 'react';
import { fetchMarketStats } from '../contracts/bountyBoard';
import { useSdsPublisherStats } from '../sds/subscriptions';

export function useMarketStats() {
  const [chainStats, setChainStats] = useState({
    totalBounties: 0,
    totalResolvers: 0,
    totalResolved: 0,
    totalVolume: 0n,
  });
  const [loading, setLoading] = useState(true);
  const sds = useSdsPublisherStats();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stats = await fetchMarketStats();
        if (!cancelled) setChainStats(stats);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { ...chainStats, loading, sdsLoaded: sds.loaded, sdsStats: sds.stats };
}
