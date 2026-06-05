/** Somnia mainnet chain configuration — Phase 2 LI.FI settlement */
export const somniaMainnet = {
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
} as const;

/** Mainnet token addresses — from Somnia LI.FI integration guide */
export const somniaMainnetTokens = {
  somiNative: '0x0000000000000000000000000000000000000000' as const,
  wsomi: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as const,
  usdc: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as const,
  usdt: '0x67B302E35Aef5EEE8c32D934F5856869EF428330' as const,
  weth: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8' as const,
} as const;

/** Placeholder — set after mainnet deploy via LI.FI SDK / Somnia docs */
export const mainnetDeployedAddresses = {
  liFiDiamond: '' as `0x${string}` | '',
  bountyBoard: '' as `0x${string}` | '',
  appealLayer: '' as `0x${string}` | '',
} as const;

export const lifiIntegratorId = 'oracle-arena' as const;
