'use client';

import { useEffect, useState } from 'react';
import type { OnChainBounty } from '../contracts';
import { fetchMarketplaceBounties } from '../contracts/bountyBoard';

export function useOpenBounties() {
  const [bounties, setBounties] = useState<OnChainBounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMarketplaceBounties();
        if (!cancelled) setBounties(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { bounties, loading };
}
