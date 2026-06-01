import { SDK } from '@somnia-chain/streams';
import { createPublicClient, createWalletClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet } from '@oracle-arena/config';
import { loadEnv } from './env.js';

const chain: Chain = {
  ...somniaTestnet,
  contracts: {},
};

export function createSdsSdk(requireWallet = true) {
  const env = loadEnv();
  const publicClient = createPublicClient({
    chain,
    transport: http(env.rpcUrl),
  });

  const walletClient = requireWallet
    ? createWalletClient({
        account: privateKeyToAccount(env.publisherPrivateKey),
        chain,
        transport: http(env.rpcUrl),
      })
    : undefined;

  return new SDK({ public: publicClient, wallet: walletClient });
}
