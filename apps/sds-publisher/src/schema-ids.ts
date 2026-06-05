import type { SDK } from '@somnia-chain/streams';
import {
  APPEALS_SCHEMA,
  BOUNTIES_SCHEMA,
  RESOLVERS_SCHEMA,
  SETTLEMENTS_SCHEMA,
  SUBMISSIONS_SCHEMA,
} from './schemas.js';

export async function computeSchemaIds(sdk: SDK) {
  const [bounties, submissions, resolvers, settlements, appeals] = await Promise.all([
    sdk.streams.computeSchemaId(BOUNTIES_SCHEMA),
    sdk.streams.computeSchemaId(SUBMISSIONS_SCHEMA),
    sdk.streams.computeSchemaId(RESOLVERS_SCHEMA),
    sdk.streams.computeSchemaId(SETTLEMENTS_SCHEMA),
    sdk.streams.computeSchemaId(APPEALS_SCHEMA),
  ]);

  return { bounties, submissions, resolvers, settlements, appeals };
}
