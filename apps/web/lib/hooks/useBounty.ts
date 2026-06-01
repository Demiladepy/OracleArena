'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OnChainBounty } from '../contracts';
import { fetchBounty, fetchConsensusStatus, fetchConsensusSubmissions } from '../contracts/bountyBoard';
import { useSdsBounty } from '../sds/subscriptions';

export function useBounty(bountyId: bigint) {
  const [bounty, setBounty] = useState<OnChainBounty | null>(null);
  const [consensusStatus, setConsensusStatus] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sds = useSdsBounty(bountyId);

  const refresh = useCallback(async () => {
    try {
      const [b, status] = await Promise.all([
        fetchBounty(bountyId),
        fetchConsensusStatus(bountyId),
      ]);
      setBounty(b);
      setConsensusStatus(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bounty');
    } finally {
      setLoading(false);
    }
  }, [bountyId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 12000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { bounty, consensusStatus, loading, error, refresh, sdsRecord: sds.record, sdsConnected: sds.connected };
}

export function useBountySubmissions(bountyId: bigint) {
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof fetchConsensusSubmissions>>>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const subs = await fetchConsensusSubmissions(bountyId);
        if (!cancelled) setSubmissions(subs);
      } catch {
        if (!cancelled) setSubmissions([]);
      }
    }

    load();
    const interval = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bountyId]);

  return submissions;
}
