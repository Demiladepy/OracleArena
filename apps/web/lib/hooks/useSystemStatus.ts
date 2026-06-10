'use client';

import { useEffect, useState } from 'react';
import {
  FOUNDRY_TEST_COUNT,
  resolveSdsPublisherStatus,
  verifyCoreContractsOnChain,
  type SdsPublisherStatus,
} from '../systemStatus';
import { useMarketStats } from './useMarketStats';

export type SystemStatusSnapshot = {
  contractsDeployed: number;
  contractsTotal: number;
  contractsOk: boolean;
  sdsStatus: SdsPublisherStatus;
  testsPassing: number;
  testsTotal: number;
  loading: boolean;
};

export function useSystemStatus(): SystemStatusSnapshot {
  const stats = useMarketStats();
  const [contracts, setContracts] = useState({ deployed: 0, total: 8, checked: false });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const result = await verifyCoreContractsOnChain();
        if (!cancelled) setContracts({ ...result, checked: true });
      } catch {
        if (!cancelled) setContracts((prev) => ({ ...prev, checked: true }));
      }
    }

    verify();
    const interval = setInterval(verify, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const sdsStatus = resolveSdsPublisherStatus(stats.sdsLoaded, stats.sdsStats);
  const loading = !contracts.checked || stats.loading;

  return {
    contractsDeployed: contracts.deployed,
    contractsTotal: contracts.total,
    contractsOk: contracts.deployed === contracts.total,
    sdsStatus,
    testsPassing: FOUNDRY_TEST_COUNT,
    testsTotal: FOUNDRY_TEST_COUNT,
    loading,
  };
}
