import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { isAddress, type Address } from 'viem';
import { deployedAddresses } from '@oracle-arena/config';

loadDotenv({ path: resolve(process.cwd(), '.env') });
loadDotenv({ path: resolve(process.cwd(), '../../contracts/.env') });

export interface AppEnv {
  rpcUrl: string;
  publisherPrivateKey: `0x${string}`;
  bountyBoard: Address;
  consensusEngine: Address;
  settlement: Address;
  resolverRegistry: Address;
}

function optionalAddress(name: string, fallback: Address): Address {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (!isAddress(value)) throw new Error(`Invalid address in ${name}: ${value}`);
  return value;
}

function requirePrivateKey(): `0x${string}` {
  const fromSds = process.env.SDS_PUBLISHER_PRIVATE_KEY?.trim();
  const fromDeployer = process.env.PRIVATE_KEY?.trim();
  const raw = fromSds || fromDeployer;
  if (!raw) {
    throw new Error('Missing SDS_PUBLISHER_PRIVATE_KEY or PRIVATE_KEY');
  }
  const normalized = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (normalized.length !== 66) {
    throw new Error('Publisher private key must be 32-byte hex');
  }
  return normalized as `0x${string}`;
}

export function loadEnv(): AppEnv {
  return {
    rpcUrl: process.env.SOMNIA_RPC_URL?.trim() || 'https://api.infra.testnet.somnia.network',
    publisherPrivateKey: requirePrivateKey(),
    bountyBoard: optionalAddress('BOUNTY_BOARD_ADDRESS', deployedAddresses.bountyBoard),
    consensusEngine: optionalAddress('CONSENSUS_ENGINE_ADDRESS', deployedAddresses.consensusEngine),
    settlement: optionalAddress('SETTLEMENT_ADDRESS', deployedAddresses.settlement),
    resolverRegistry: optionalAddress('RESOLVER_REGISTRY_ADDRESS', deployedAddresses.resolverRegistry),
  };
}
