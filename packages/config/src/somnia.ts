// Values reflect Somnia Agents dev guide as of May 2026.
// Verify against current platform docs before mainnet deployment.

/** Somnia testnet chain configuration */
export const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.testnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
} as const;

/** Platform contract addresses — subject to change pre-mainnet */
export const somniaContracts = {
  agentRegistry: '0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A' as const,
  platformContract: '0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3' as const,
} as const;

/** Protocol constants (MVP) */
export const protocolConfig = {
  protocolFeeBps: 200, // 2%
  minimumResolverBondWei: 50n * 10n ** 18n, // 50 STT
  firstSubmitterShareBps: 6000, // 60%
  secondSubmitterShareBps: 4000, // 40%
} as const;

/** Oracle Arena deployed contract addresses — populate after testnet deploy */
export const deployedAddresses = {
  bountyBoard: '' as `0x${string}` | '',
  /** ToolsChatProbe — inferToolsChat verification contract (not production) */
  toolsChatProbe: '' as `0x${string}` | '',
  resolverRegistry: '' as `0x${string}` | '',
  consensusEngine: '' as `0x${string}` | '',
  settlement: '' as `0x${string}` | '',
  liFiAdapter: '' as `0x${string}` | '',
  streamPublisher: '' as `0x${string}` | '',
  /** MVP placeholder — BountyBoard constructor; update when ProtocolTreasury is deployed */
  protocolTreasury: '' as `0x${string}` | '',
  resolverAgentA: '' as `0x${string}` | '',
  resolverAgentB: '' as `0x${string}` | '',
} as const;

export type DeployedAddresses = typeof deployedAddresses;
