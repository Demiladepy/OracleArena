import type { SDK } from '@somnia-chain/streams';
import type { Hex } from 'viem';
import {
  APPEALS_SCHEMA,
  BOUNTIES_SCHEMA,
  RESOLVERS_SCHEMA,
  SETTLEMENTS_SCHEMA,
  SUBMISSIONS_SCHEMA,
} from './schemas.js';

async function schemaId(sdk: SDK, schema: string): Promise<Hex> {
  return (await sdk.streams.computeSchemaId(schema)) as Hex;
}

export async function computeSchemaIds(sdk: SDK) {
  const [bounties, submissions, resolvers, settlements, appeals] = await Promise.all([
    schemaId(sdk, BOUNTIES_SCHEMA),
    schemaId(sdk, SUBMISSIONS_SCHEMA),
    schemaId(sdk, RESOLVERS_SCHEMA),
    schemaId(sdk, SETTLEMENTS_SCHEMA),
    schemaId(sdk, APPEALS_SCHEMA),
  ]);

  return { bounties, submissions, resolvers, settlements, appeals };
}
