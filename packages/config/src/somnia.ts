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

/** Platform contract addresses — authoritative: https://agents.testnet.somnia.network */
export const somniaContracts = {
  agentRegistry: '0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A' as const,
  /** SomniaAgents platform — live testnet (May 2026) */
  platformContract: '0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776' as const,
} as const;

/** Protocol constants (MVP) */
export const protocolConfig = {
  protocolFeeBps: 200, // 2%
  minimumResolverBondWei: 50n * 10n ** 18n, // 50 STT production target
  firstSubmitterShareBps: 6000, // 60%
  secondSubmitterShareBps: 4000, // 40%
} as const;

/** Oracle Arena deployed contract addresses — Somnia testnet (chain 50312) */
export const deployedAddresses = {
  bountyBoard: '0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290' as const,
  /** inferToolsChat verification probe — wired to correct platform 0x037Bb9… */
  toolsChatProbe: '0x8bd481D5E202561A9aE09ff8Ab3E41D175F2B6f2' as const,
  // MIN_BOND = 1 STT (testnet). Production target is 50 STT — set via constructor.
  resolverRegistry: '0x0AcEF373884b7843592904e74F87ABD46ca035CF' as const,
  consensusEngine: '0xB2495D336d59D193Fa2463b95248dE240aBfe6df' as const,
  settlement: '0x1036E3837418695A6731405B8EBf954834508B5c' as const,
  liFiAdapter: '0xf00dDBc8319843c036BC2FA8162328377f154f7d' as const,
  resolverPayoutPrefs: '0x9Af19D44e9E7880ea7a269c4cCD76aa01a40ABa8' as const,
  mockLiFiRouter: '0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6' as const,
  streamPublisher: '' as `0x${string}` | '',
  /** MVP placeholder — BountyBoard.protocolTreasury; update when ProtocolTreasury deploys */
  protocolTreasury: '0x0C503557CC81701037240e982c9520Aa1ffca4Cc' as const,
  /** ResolverAgent v3 — correct platform 0x037Bb9… + verified 6-tuple decoder */
  resolverAgentA: '0x490B7B63301025CE2970b25F623Dbe963a13e60B' as const,
  /** ResolverAgent v3 — SomniaNative default payout (no explicit pref set) */
  resolverAgentB: '0xe4Faf7CeC814038BA09F0E177b37751d565bbFed' as const,
} as const;

/** Canonical demo wiring — Somnia testnet (May 2026) */
export const demoConfig = {
  /** Canonical settled demo — full chain including MockBridge */
  bountyId: 4,
  bountyBoard: deployedAddresses.bountyBoard,
  agentA: deployedAddresses.resolverAgentA,
  agentB: deployedAddresses.resolverAgentB,
  agent: deployedAddresses.resolverAgentA,
  claim: 'Is the chemical formula for water H2O?',
  payoutWei: 200000000000000000n,
  deadlineDays: 6,
  fullChainCompleted: true,
  consensusOutcome: 'Agreed' as const,
  /** First live attempt — disagreement demo */
  legacyDemoBountyId: 1,
} as const;

/** Superseded testnet deployments — kept for transparency */
export const legacyAddresses = {
  /** v1 — deployer placeholder consensusEngine; bounty #2 stranded here */
  bountyBoardV1: '0xcf812e4735CeA2a5d966ad2999e982b2ED623092' as const,
  /** v1 — MIN_BOND hard-coded 50 STT */
  resolverRegistryV1: '0x520a8466d4616c9d8b3f23B98fD4f8AA50500D8B' as const,
  /** v2 — deployer placeholder consensusEngine */
  resolverRegistryV2: '0x0F29c7ED799F8Bfac1E2dAF425911a4054f0a88B' as const,
  /** v2 board + CE v1 wiring (ConsensusEngine phase) */
  bountyBoardV2: '0x14aB2e6C33A0CFd4747aFc9D4bA4D3D6Cbbc81cE' as const,
  /** v3 registry + CE v1 (ConsensusEngine phase) */
  resolverRegistryV3: '0xa9AD0687076c9d99250C961d0E41914448DB823b' as const,
  /** CE v1 — no Settlement wiring */
  consensusEngineV1: '0x0e5789E15081411A1048D5B4915cd6F20d66a0c8' as const,
  /** Superseded — wired to v1 board + v2 registry immutables */
  resolverAgentV1: '0x2CBb5d1384b4f20242303509b55CA104B6da12f2' as const,
  /** Smoke deploy — stale BOUNTY_BOARD_ADDRESS env */
  resolverAgentWrongBoard: '0xA86a346d747AF65456a971931e2d308bF98f8C12' as const,
  /** v1 on v3 board — recordSubmission path (Settlement phase, superseded by v2) */
  resolverAgentV1Settlement: '0x0f99957287c25313afC7eC3978eDAE3a97A72269' as const,
  /** v2 — wrong platform 0x7407… (outdated dev guide blog address) */
  resolverAgentV2DemoSetup: '0xb01e811a0caEd38ccaB4670Df02bEC0E280A9e74' as const,
  /** inferToolsChat probe — wired to wrong platform */
  toolsChatProbeV1: '0xB9f15fc7d54B0B2B575903fAF125c559BD474c3E' as const,
  /** Incorrect platform from outdated Somnia dev guide blog post */
  platformContractWrong: '0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3' as const,
} as const;

export type DeployedAddresses = typeof deployedAddresses;
