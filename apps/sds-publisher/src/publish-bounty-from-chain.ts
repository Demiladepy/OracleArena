import { createPublicClient, http, type Chain } from 'viem';
import { somniaTestnet } from '@oracle-arena/config';
import { loadEnv } from './env.js';
import { createSdsSdk } from './sdk.js';
import { computeSchemaIds } from './schema-ids.js';
import { publishBountyRecord } from './publish.js';
import { bountyBoardAbi } from './contracts.js';
import { BountyStatus } from './schemas.js';

const chain: Chain = { ...somniaTestnet, contracts: {} };

async function main() {
  const bountyId = BigInt(process.argv[2] ?? '0');
  const status = Number(process.argv[3] ?? BountyStatus.Open);
  if (bountyId === 0n) {
    console.error('Usage: tsx src/publish-bounty-from-chain.ts <bountyId> [status]');
    process.exit(1);
  }

  const env = loadEnv();
  const sdk = createSdsSdk(true);
  const schemaIds = await computeSchemaIds(sdk);
  const publicClient = createPublicClient({ chain, transport: http(env.rpcUrl) });

  const bounty = await publicClient.readContract({
    address: env.bountyBoard,
    abi: bountyBoardAbi,
    functionName: 'getBounty',
    args: [bountyId],
  });

  const tx = await publishBountyRecord(sdk, schemaIds.bounties, {
    createdAt: BigInt(bounty.createdAt),
    bountyId,
    poster: bounty.poster,
    bountyType: bounty.bountyType,
    claim: bounty.claim,
    deadline: BigInt(bounty.deadline),
    payout: bounty.payout,
    status,
  });

  console.log('Published bounty record tx:', tx);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
