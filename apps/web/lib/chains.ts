import { defineChain } from 'viem';
import { somniaTestnet } from '@oracle-arena/config';

export const somniaChain = defineChain({
  ...somniaTestnet,
  id: somniaTestnet.id,
  contracts: {},
});

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? 'https://api.infra.testnet.somnia.network';

export const EXPLORER_URL = somniaTestnet.blockExplorers.default.url;
