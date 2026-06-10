import type { Address } from 'viem';
import { deployedAddresses } from '@oracle-arena/config';
import { publicClient } from './viem';

/** Core protocol contracts shown on landing system status (8/8). */
export const CORE_PROTOCOL_CONTRACTS: readonly { label: string; address: Address }[] = [
  { label: 'BountyBoard', address: deployedAddresses.bountyBoard as Address },
  { label: 'ResolverRegistry', address: deployedAddresses.resolverRegistry as Address },
  { label: 'ConsensusEngine', address: deployedAddresses.consensusEngine as Address },
  { label: 'Settlement', address: deployedAddresses.settlement as Address },
  { label: 'ResolverPayoutPrefs', address: deployedAddresses.resolverPayoutPrefs as Address },
  { label: 'LiFiAdapter', address: deployedAddresses.liFiAdapter as Address },
  { label: 'MockLiFiRouter', address: deployedAddresses.mockLiFiRouter as Address },
  { label: 'AppealLayer', address: deployedAddresses.appealLayer as Address },
];

export const FOUNDRY_TEST_COUNT = 144;

export type SdsPublisherStatus = 'checking' | 'live' | 'paused';

export function resolveSdsPublisherStatus(
  sdsLoaded: boolean,
  stats: { bounties: bigint; resolvers: bigint; settlements: bigint },
): SdsPublisherStatus {
  if (!sdsLoaded) return 'checking';
  const total = stats.bounties + stats.resolvers + stats.settlements;
  return total > 0n ? 'live' : 'paused';
}

export async function verifyCoreContractsOnChain(): Promise<{ deployed: number; total: number }> {
  const total = CORE_PROTOCOL_CONTRACTS.length;
  const checks = await Promise.all(
    CORE_PROTOCOL_CONTRACTS.map(async ({ address }) => {
      const code = await publicClient.getBytecode({ address });
      return code !== undefined && code !== '0x' && code.length > 2;
    }),
  );
  return { deployed: checks.filter(Boolean).length, total };
}
