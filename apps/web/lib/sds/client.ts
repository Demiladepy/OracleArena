import { SDK } from '@somnia-chain/streams';
import { publicClient } from '../viem';

let sdkInstance: SDK | null = null;

export function getSdsSdk(): SDK {
  if (!sdkInstance) {
    sdkInstance = new SDK({ public: publicClient });
  }
  return sdkInstance;
}
