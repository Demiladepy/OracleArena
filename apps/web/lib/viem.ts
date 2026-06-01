import { createPublicClient, http } from 'viem';
import { somniaChain, RPC_URL } from './chains';

export const publicClient = createPublicClient({
  chain: somniaChain,
  transport: http(RPC_URL, { batch: true }),
});
