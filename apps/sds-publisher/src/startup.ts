import { createPublicClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet } from '@oracle-arena/config';
import { loadEnv } from './env.js';
import { createSdsSdk } from './sdk.js';
import { ALL_SCHEMAS } from './schemas.js';

const EXPECTED_PUBLISHER = '0x0C503557CC81701037240e982c9520Aa1ffca4Cc';
const MIN_BALANCE_STT = 5;

export async function runStartupChecks(): Promise<void> {
  const env = loadEnv();
  const account = privateKeyToAccount(env.publisherPrivateKey);

  console.log('Publisher running as:', account.address);
  console.log('Expected funded wallet:', EXPECTED_PUBLISHER);
  if (account.address.toLowerCase() !== EXPECTED_PUBLISHER.toLowerCase()) {
    console.warn('WARNING: publisher wallet does not match expected deployer EOA');
  }

  const chain: Chain = { ...somniaTestnet, contracts: {} };
  const client = createPublicClient({ chain, transport: http(env.rpcUrl) });
  const balance = await client.getBalance({ address: account.address });
  const balanceSTT = Number(balance) / 1e18;
  console.log(`Publisher wallet balance: ${balanceSTT.toFixed(4)} STT`);
  if (balanceSTT < MIN_BALANCE_STT) {
    console.warn('LOW BALANCE: publisher may run out of gas. Top up at faucet.');
  }

  const sdk = createSdsSdk(false);
  let missingSchemas = 0;
  for (const entry of ALL_SCHEMAS) {
    const schemaId = (await sdk.streams.computeSchemaId(entry.schema)) as `0x${string}`;
    const registered = await sdk.streams.isDataSchemaRegistered(schemaId);
    console.log(`Schema ${entry.schemaName}: registered=${registered}`);
    if (!registered) missingSchemas += 1;
  }
  if (missingSchemas > 0) {
    console.warn(
      `WARNING: ${missingSchemas} schema(s) not registered — run "pnpm sds-publish:setup-schemas" once before publishing`,
    );
  }

  console.log('Watching contracts:');
  console.log('  BountyBoard:', env.bountyBoard);
  console.log('  ConsensusEngine:', env.consensusEngine);
  console.log('  Settlement:', env.settlement);
  console.log('  ResolverRegistry:', env.resolverRegistry);
}
