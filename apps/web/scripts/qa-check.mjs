import { createPublicClient, http } from 'viem';

const RPC = 'https://api.infra.testnet.somnia.network';
const bountyBoard = '0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290';
const consensusEngine = '0xB2495D336d59D193Fa2463b95248dE240aBfe6df';

const bountyBoardAbi = [
  {
    name: 'getBounty',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'poster', type: 'address' },
          { name: 'claim', type: 'string' },
          { name: 'evidenceSources', type: 'string[]' },
          { name: 'bountyType', type: 'bytes32' },
          { name: 'deadline', type: 'uint64' },
          { name: 'payout', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'resolvedAt', type: 'uint64' },
          { name: 'winningVerdictHash', type: 'bytes32' },
        ],
      },
    ],
  },
  { name: 'bountyCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

const consensusAbi = [
  {
    name: 'getStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'getSubmissions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'resolver', type: 'address' },
          { name: 'verdictHash', type: 'bytes32' },
          { name: 'confidence', type: 'uint16' },
          { name: 'evidenceUri', type: 'string' },
          { name: 'submittedAt', type: 'uint64' },
        ],
      },
    ],
  },
];

const client = createPublicClient({ transport: http(RPC) });

const statusLabels = ['Pending', 'Agreed', 'Disagreed', 'Unresolved'];
const bountyStatusLabels = ['Open', 'Submitted', 'Resolved', 'Unresolved', 'Cancelled'];

for (const id of [1n, 4n]) {
  const bounty = await client.readContract({
    address: bountyBoard,
    abi: bountyBoardAbi,
    functionName: 'getBounty',
    args: [id],
  });
  const status = await client.readContract({
    address: consensusEngine,
    abi: consensusAbi,
    functionName: 'getStatus',
    args: [id],
  });
  const subs = await client.readContract({
    address: consensusEngine,
    abi: consensusAbi,
    functionName: 'getSubmissions',
    args: [id],
  });
  console.log(`\n=== Bounty #${id} ===`);
  console.log('claim:', bounty.claim.slice(0, 60) + '…');
  console.log('board status:', bountyStatusLabels[bounty.status] ?? bounty.status);
  console.log('consensus:', statusLabels[status] ?? status);
  console.log('submissions:', subs.length);
  subs.forEach((s, i) => console.log(`  ${i + 1}. ${s.resolver.slice(0, 10)}… conf=${s.confidence}`));
}

const count = await client.readContract({
  address: bountyBoard,
  abi: bountyBoardAbi,
  functionName: 'bountyCount',
});
console.log('\nTotal bounties on board:', count.toString());
