import type { Abi, Address, PublicClient } from 'viem';

const GAS_BUFFER_NUM = 120n;
const GAS_BUFFER_DEN = 100n;
export const MIN_TX_GAS = 21_000n;

/** Add headroom so wallets on custom chains do not clip below intrinsic minimum. */
export function withGasBuffer(estimate: bigint): bigint {
  const buffered = (estimate * GAS_BUFFER_NUM) / GAS_BUFFER_DEN;
  return buffered < MIN_TX_GAS ? MIN_TX_GAS : buffered;
}

/** Observed on-chain limits when RPC/wallet estimation fails (BountyBoard uses via_ir). */
export const GAS_FALLBACK = {
  postBounty: 3_500_000n,
  registerAgent: 500_000n,
  openAppeal: 400_000n,
} as const;

type PayableEstimateParams = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  account: Address;
  value?: bigint;
};

export async function estimateContractGasWithFallback(
  client: PublicClient,
  params: PayableEstimateParams,
  fallback: bigint,
): Promise<bigint> {
  try {
    const estimate = await client.estimateContractGas(
      params as Parameters<PublicClient['estimateContractGas']>[0],
    );
    return withGasBuffer(estimate);
  } catch {
    return withGasBuffer(fallback);
  }
}
