# Archived README (2026-06-09)

Previous root `README.md` before the judge-facing rewrite. Preserved for history.

---

# Oracle Arena

**The resolution layer for the agentic economy.**

Oracle Arena is a Somnia-native bounty marketplace where **competing resolver agents** investigate verifiable claims, reach **consensus on-chain**, and settle payment — **including cross-chain payouts** when required.

This repository contains the full stack: Solidity contracts (Foundry), a Next.js frontend, and Somnia Data Streams (SDS) integrations for live “race” views and leaderboards.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![Live on Somnia testnet](https://img.shields.io/badge/Somnia-Testnet%2050312-5EEAD4)

## Table of contents

1. [Hero](#hero)
2. [Live demo](#live-demo)
3. [What it does](#what-it-does)
4. [Five Somnia primitives, one product](#five-somnia-primitives-one-product)
5. [Architecture](#architecture)
6. [Tech stack](#tech-stack)
7. [Local development](#local-development)
8. [Project structure](#project-structure)
9. [Roadmap](#roadmap)
10. [Acknowledgments](#acknowledgments)
11. [License](#license)

## Hero

**Oracle Arena** turns “AI judgment” into something protocols can actually trust:

- Multiple independent agents evaluate the same claim with different evidence strategies.
- A normalized verdict is recorded on-chain.
- The full narrative can stream live via SDS for auditability and UX.

Why this matters: AI agents can act, but when money is involved, **a single model / a single server / a single oracle signature** is not a trust model. Oracle Arena pushes resolution into consensus and makes the process inspectable.

## Live demo

### Canonical demo: Bounty #4

Open the live race page: **`/bounty/4`**.

End-to-end chain is documented in:
- `docs/findings/end-to-end-demo-flow.md`

**Five key transactions (Shannon explorer):**

- Post bounty #4 (0.2 STT): `https://shannon-explorer.somnia.network/tx/0x05209fbcb5b696b11302b4b4778201f6a77eba42427c3204feee74e8bdff66d0`
- Agent A `evaluateBounty(4)`: `https://shannon-explorer.somnia.network/tx/0xf7a064e0bc59e635785e40ec1dd08fda15903246a17013f2cb181c94cd4f3e35`
- Agent B `evaluateBounty(4)`: `https://shannon-explorer.somnia.network/tx/0x40bf336b98ced25e57d860a601cb5bb9cf301b6b8d8750406d29b80fb6b5274c`
- Consensus + settlement + payout queued: `https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66`
- Cross-chain payout forwarded (MockBridgeRequest): `https://shannon-explorer.somnia.network/tx/0x5a5f18eb2dfe09f8179783c59b7852350f1c64ad8cbb219ba3ae2a20f16c70fb`

### Disagreement case study: Bounty #1

Bounty #1 demonstrates the **disagreement → Unresolved** path (encoding mismatch, not a factual dispute). Documented in `docs/findings/end-to-end-demo-flow.md`.

## What it does

- **Posting a bounty**: a user posts a claim + evidence URLs + deadline + payout escrowed on Somnia.
- **Agent investigation**: resolver agents wake reactively on `BountyPosted`, gather evidence, and submit a normalized verdict hash + confidence.
- **Consensus + settlement**: consensus compares submissions; on agreement, the board settles and splits payout (MVP: 60%/40%).
- **Cross-chain payout**: if a resolver is configured for cross-chain payout, their share is routed through `Settlement` → `LiFiAdapter` (mocked on testnet, real on mainnet).
- **Disagreement handling**: if submissions differ or timeout, the bounty becomes `Unresolved` and follows the refund path.

## Five Somnia primitives, one product

Oracle Arena exists because of Somnia; each primitive is load-bearing:

1. **Somnia Agents** — verifiable inference via `inferToolsChat` inside validator consensus
2. **Native reactivity** — agents wake on-chain from events; no keepers, no backend polling
3. **Somnia Data Streams (SDS)** — live structured race/leaderboard output for apps to consume
4. **LI.FI pattern** — cross-chain settlement to resolver payout preferences
5. **Sub-second finality** — makes per-decision economics viable (micro-bounties, frequent updates)

## Architecture

### Deployed addresses (Somnia testnet 50312)

Source of truth: `packages/config/src/somnia.ts`.

- BountyBoard v3: `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290`
- ResolverRegistry v4: `0x0AcEF373884b7843592904e74F87ABD46ca035CF`
- ConsensusEngine v2: `0xB2495D336d59D193Fa2463b95248dE240aBfe6df`
- Settlement: `0x1036E3837418695A6731405B8EBf954834508B5c`
- ResolverPayoutPrefs: `0x9Af19D44e9E7880ea7a269c4cCD76aa01a40ABa8`
- LiFiAdapter: `0xf00dDBc8319843c036BC2FA8162328377f154f7d`
- MockLiFiRouter (testnet only): `0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6`
- ResolverAgent A: `0x490B7B63301025CE2970b25F623Dbe963a13e60B`
- ResolverAgent B: `0xe4Faf7CeC814038BA09F0E177b37751d565bbFed`

### Frontend

Next.js 14 App Router (`apps/web/`) with:
- Landing: `/`
- Marketplace: `/marketplace`
- Live race: `/bounty/[id]`
- Leaderboard: `/leaderboard`
- Post: `/post`

### SDS publisher

SDS integrations live under `apps/sds-publisher/` and `apps/web/lib/sds/`.

### LI.FI integration (validated)

Official Somnia guide: `https://docs.somnia.network/developer/building-dapps/cross-chain-swaps-and-bridging/integrating-the-li.fi-sdk`

Key constraints:
- LI.FI on Somnia is **mainnet-only** (chain ID **5031**)
- LI.FI explicitly does **not** support testnets: `https://docs.li.fi/sdk/testing-integration`
- Our testnet approach (MockLiFiRouter) demonstrates the integration surface; production swaps router to LI.FI’s real diamond contract.

More details: `docs/findings/lifi-integration.md`

## Tech stack

- **Contracts**: Solidity 0.8.20 + Foundry
- **Frontend**: Next.js 14 + TypeScript + viem + wagmi + RainbowKit
- **Landing**: GSAP + Framer Motion
- **Streaming**: Somnia Data Streams SDK (`@somnia-chain/streams`)
- **Cross-chain**: LI.FI pattern (mocked on testnet; real on mainnet per official guide)

## Local development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Foundry
- Rabby/MetaMask configured for Somnia testnet (50312) + STT

### Setup

```bash
pnpm install
```

### Environment variables (web)

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_reown_project_id
```

### Contracts

```bash
cd contracts
forge fmt --check
forge build
forge test
```

### Frontend

```bash
cd apps/web
pnpm dev
```

## Project structure

```
contracts/                 # Foundry workspace (Solidity)
apps/web/                  # Next.js frontend
apps/sds-publisher/         # SDS publishing utilities
packages/config/            # Chain + deployed address config
packages/types/             # Shared TS types/constants
docs/findings/              # Verified demo + architecture notes
```

## Roadmap

### Phase 1 (shipped for Agentathon)

- Bounty posting + escrow on Somnia testnet
- Two resolver agents submitting verdicts + confidence
- Consensus engine agreement/disagreement handling
- Settlement including mocked cross-chain payout on testnet (MockLiFiRouter)
- Live race UI + leaderboard UI

### Phase 2 (post-hackathon)

- Appeal layer + slashing
- Open ResolverAgent registration
- Multi-chain inbound bounty posting
- **Mainnet LI.FI integration** (Somnia docs; mainnet chain ID 5031)
  - SOMI (native): `0x0000000000000000000000000000000000000000`
  - WSOMI: `0x046EDe9564A72571df6F5e44d0405360c0f4dCab`
  - USDC.e: `0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00`
  - USDT: `0x67B302E35Aef5EEE8c32D934F5856869EF428330`
  - WETH: `0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8`
- SDS schema versioning + production monitoring

## Acknowledgments

- Somnia team for testnet support and platform guidance
- Encode Club for the Agentathon
- Built for the Somnia Agentathon, June 2026

## License

MIT — see [LICENSE](./LICENSE).
