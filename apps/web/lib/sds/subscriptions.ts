'use client';

import { useEffect, useState } from 'react';
import type { SdsBountyRecord } from '@oracle-arena/types';
import { getSdsSdk } from './client';
import { SDS_PUBLISHER_ADDRESS, SDS_SCHEMA_IDS, bountyDataId } from './schemas';
import { decodeSdsBountyRecord } from './transformers';

export function useSdsBounty(bountyId: bigint | null, pollMs = 15000) {
  const [record, setRecord] = useState<SdsBountyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bountyId === null) return;

    let cancelled = false;

    async function fetchRecord() {
      try {
        const sdk = getSdsSdk();
        const dataId = bountyDataId(bountyId!);
        const raw = await sdk.streams.getByKey(SDS_SCHEMA_IDS.bounties, SDS_PUBLISHER_ADDRESS, dataId);
        if (cancelled) return;
        setRecord(decodeSdsBountyRecord(raw));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'SDS fetch failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecord();
    const interval = setInterval(fetchRecord, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bountyId, pollMs]);

  return { record, loading, error, connected: record !== null };
}

export function useSdsPublisherStats(pollMs = 30000) {
  const [stats, setStats] = useState({ bounties: 0n, resolvers: 0n, settlements: 0n });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const sdk = getSdsSdk();
        const [bountiesRaw, resolversRaw, settlementsRaw] = await Promise.all([
          sdk.streams.totalPublisherDataForSchema(SDS_SCHEMA_IDS.bounties, SDS_PUBLISHER_ADDRESS),
          sdk.streams.totalPublisherDataForSchema(SDS_SCHEMA_IDS.resolvers, SDS_PUBLISHER_ADDRESS),
          sdk.streams.totalPublisherDataForSchema(SDS_SCHEMA_IDS.settlements, SDS_PUBLISHER_ADDRESS),
        ]);
        if (!cancelled) {
          setStats({
            bounties: typeof bountiesRaw === 'bigint' ? bountiesRaw : 0n,
            resolvers: typeof resolversRaw === 'bigint' ? resolversRaw : 0n,
            settlements: typeof settlementsRaw === 'bigint' ? settlementsRaw : 0n,
          });
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { stats, loaded };
}
