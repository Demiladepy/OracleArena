import { zeroBytes32 } from '@somnia-chain/streams';
import { createSdsSdk } from './sdk.js';
import { ALL_SCHEMAS } from './schemas.js';
import { computeSchemaIds } from './schema-ids.js';

async function main() {
  const sdk = createSdsSdk(true);
  const ids = await computeSchemaIds(sdk);

  console.log('Computed schema IDs:');
  console.log('  bounties:', ids.bounties);
  console.log('  submissions:', ids.submissions);
  console.log('  resolvers:', ids.resolvers);
  console.log('  settlements:', ids.settlements);

  for (const entry of ALL_SCHEMAS) {
    const schemaId = await sdk.streams.computeSchemaId(entry.schema);
    const registered = await sdk.streams.isDataSchemaRegistered(schemaId);
    console.log(`  ${entry.schemaName}: registered=${registered}`);
  }

  const tx = await sdk.streams.registerDataSchemas(
    ALL_SCHEMAS.map((entry) => ({
      schemaName: entry.schemaName,
      schema: entry.schema,
      parentSchemaId: zeroBytes32,
    })),
    true,
  );

  console.log('registerDataSchemas tx:', tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
