import { createPublicClient, http } from 'viem';
import { somniaChain } from './chains';

const rpcUrl =
  process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? 'https://api.infra.testnet.somnia.network';

export const publicClient = createPublicClient({
  chain: {
    ...somniaChain,
    id: somniaChain.id,
  },
  transport: http(rpcUrl),
});
