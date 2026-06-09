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
  console.log('  appeals:', ids.appeals);

  const pending = [];
  for (const entry of ALL_SCHEMAS) {
    const schemaId = (await sdk.streams.computeSchemaId(entry.schema)) as `0x${string}`;
    const registered = await sdk.streams.isDataSchemaRegistered(schemaId);
    console.log(`  ${entry.schemaName}: registered=${registered}`);
    if (!registered) {
      pending.push(entry);
    }
  }

  if (pending.length === 0) {
    console.log('All schemas already registered — skipping registerDataSchemas');
    return;
  }

  console.log(`Registering ${pending.length} schema(s)...`);
  const tx = await sdk.streams.registerDataSchemas(
    pending.map((entry) => ({
      schemaName: entry.schemaName,
      schema: entry.schema,
      parentSchemaId: zeroBytes32 as `0x${string}`,
    })),
    true,
  );

  console.log('registerDataSchemas tx:', tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
