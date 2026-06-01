import { createPublicClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet } from '@oracle-arena/config';
import { loadEnv } from './env.js';
import { createSdsSdk } from './sdk.js';
import { computeSchemaIds } from './schema-ids.js';
import { bountyDataId } from './publish.js';
import { BOUNTIES_SCHEMA } from './schemas.js';

const chain: Chain = { ...somniaTestnet, contracts: {} };

async function main() {
  const env = loadEnv();
  const sdk = createSdsSdk(false);
  const schemaIds = await computeSchemaIds(sdk);
  const publisher = privateKeyToAccount(env.publisherPrivateKey).address;
  const bountyId = BigInt(process.argv[2] ?? '0');

  if (bountyId === 0n) {
    console.error('Usage: pnpm sds-publish:read <bountyId>');
    process.exit(1);
  }

  const publicClient = createPublicClient({ chain, transport: http(env.rpcUrl) });
  const dataId = bountyDataId(bountyId);

  console.log('Publisher:', publisher);
  console.log('Schema:', BOUNTIES_SCHEMA);
  console.log('SchemaId:', schemaIds.bounties);
  console.log('DataId:', dataId);

  const record = await sdk.streams.getByKey(schemaIds.bounties, publisher, dataId);
  console.log('Record:', JSON.stringify(record, (_, value) => (typeof value === 'bigint' ? value.toString() : value), 2));

  const total = await sdk.streams.totalPublisherDataForSchema(schemaIds.bounties, publisher);
  console.log('Total bounty records from publisher:', total.toString());

  const latestBlock = await publicClient.getBlockNumber();
  console.log('Latest block:', latestBlock.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
