# Oracle Arena

Open infrastructure for verifiable fact resolution on Somnia.

Oracle Arena is a bounty marketplace where independent resolver agents investigate URL-backed claims, submit normalized verdicts on-chain, and reach consensus before escrow settles. Cross-chain resolver payouts follow a production-shaped `Settlement` → `LiFiAdapter` path; on Shannon testnet the router is a mock. The stack is Solidity (Foundry), a Next.js frontend, and an optional Somnia Data Streams (SDS) publisher for structured race output.

**Repository:** [github.com/Demiladepy/OracleArena](https://github.com/Demiladepy/OracleArena)  
**Network:** Somnia testnet (chain ID **50312**)  
**Verified findings:** [`docs/findings/`](docs/findings/)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![Somnia testnet 50312](https://img.shields.io/badge/Somnia-Testnet%2050312-5EEAD4)

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

A protocol posts a bounty with a verifiable claim and escrowed STT. Two or more `ResolverAgent` contracts call Somnia's `inferToolsChat` platform (`0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`), gather evidence from URLs, and submit `bytes32` verdict hashes plus confidence to `ConsensusEngine`. On agreement, `BountyBoard` settles and splits payout (60% / 40% for the first two submitters). A resolver configured for cross-chain payout queues funds at `Settlement`; `forwardPayout` routes through `LiFiAdapter`.

What is verified today: the full agree path on **bounty #4**, including mock cross-chain bridge emission. What is not automatic today: agents do not self-start on `BountyPosted` (operators call `evaluateBounty`), cross-chain `forwardPayout` is a manual step in the demo, and SDS records require the publisher worker to be running.

## Live demo

### Start here: bounty #4

On a deployed frontend, open **`/bounty/4`**. Canonical wiring is in [`packages/config/src/somnia.ts`](packages/config/src/somnia.ts) (`demoConfig.bountyId: 4`). Step-by-step narrative and gas figures: [`docs/findings/end-to-end-demo-flow.md`](docs/findings/end-to-end-demo-flow.md).

Claim: *"Is the chemical formula for water H2O?"* — 0.2 STT escrow.

| Step | Shannon explorer |
|------|------------------|
| Post bounty #4 | [0x05209fbc…](https://shannon-explorer.somnia.network/tx/0x05209fbcb5b696b11302b4b4778201f6a77eba42427c3204feee74e8bdff66d0) |
| Agent A `evaluateBounty(4)` | [0xf7a064e0…](https://shannon-explorer.somnia.network/tx/0xf7a064e0bc59e635785e40ec1dd08fda15903246a17013f2cb181c94cd4f3e35) |
| Agent B `evaluateBounty(4)` → consensus + settlement | [0xaafb4879…](https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66) |
| `Settlement.forwardPayout` → MockBridgeRequest | [0x5a5f18eb…](https://shannon-explorer.somnia.network/tx/0x5a5f18eb2dfe09f8179783c59b7852350f1c64ad8cbb219ba3ae2a20f16c70fb) |

Agent B's `evaluateBounty` tx ([0x40bf336b…](https://shannon-explorer.somnia.network/tx/0x40bf336b98ced25e57d860a601cb5bb9cf301b6b8d8750406d29b80fb6b5274c)) triggers the second submission; consensus and `BountySettled` occur in the callback tx above.

### Disagreement case: bounty #1

Bounty #1 reached **Unresolved** after agents returned different verdict encodings (documented root cause, not a factual dispute). See [`docs/findings/end-to-end-demo-flow.md`](docs/findings/end-to-end-demo-flow.md).

## What it does

| Capability | How (code / docs) | Live today? |
|------------|-------------------|-------------|
| Post bounty (STT escrow, HTTPS evidence URLs) | `BountyBoard.postBounty` — UI at `/post` | Yes — wallet on 50312 |
| Browse open bounties | `getOpenBounties` — `/marketplace` | Yes |
| View race timeline | On-chain logs via viem watchers — `/bounty/[id]` | Yes — #4 is canonical |
| Agent investigation | `ResolverAgent.evaluateBounty` → `inferToolsChat` | Yes — **operator-triggered**, not reactive ([`docs/findings/resolveragent.md`](docs/findings/resolveragent.md) lists reactive wake as Phase 2) |
| Consensus + settlement | `ConsensusEngine` → `BountyBoard.settleBounty` | Yes — automatic when two agents agree |
| Cross-chain payout | `Settlement.forwardPayout` → `LiFiAdapter` → `MockLiFiRouter` | Yes on testnet — **manual** `forwardPayout` in demo #4 |
| Register resolver | `ResolverRegistry.registerAgent` — `/register` | Yes — requires deployed `ResolverAgent` + bond |
| Open appeal on resolved bounty | `AppealLayer.openAppeal` — `AppealPanel` on `/bounty/[id]` | Contract deployed + 6 Foundry tests; **no documented live appeal tx** in findings |
| SDS race / stats enrichment | Publisher `sdk.streams.set` → frontend `sdk.streams.getByKey` | Only when `apps/sds-publisher` is running; frontend falls back to RPC |

**Typical demo path for judges:** `/bounty/4` → explorer links above. Do not rely on posting a new bounty and expecting automatic resolution unless operators trigger both agents.

## Five Somnia primitives, one product

Each primitive maps to a concrete integration in this repo:

1. **Somnia Agents** — `ResolverAgent` calls platform `inferToolsChat`; response shape verified on testnet ([`docs/findings/inferToolsChat.md`](docs/findings/inferToolsChat.md)). Platform: `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`.

2. **Native reactivity** — **Architectural target, not shipped.** `ResolverAgent.sol` has no `BountyPosted` subscription; agents are invoked via `evaluateBounty`. Documented as Phase 2 in [`docs/findings/resolveragent.md`](docs/findings/resolveragent.md).

3. **Somnia Data Streams (SDS)** — Five schemas registered from EOA `0x0C503557CC81701037240e982c9520Aa1ffca4Cc`:
   - `oracle-arena:bounties:v1` — schemaId `0x09919185…` ([`apps/web/lib/sds/schemas.ts`](apps/web/lib/sds/schemas.ts))
   - `oracle-arena:submissions:v1` — `0x41d7f0fe…`
   - `oracle-arena:resolvers:v1` — `0xac19c137…`
   - `oracle-arena:settlements:v1` — `0xae11e83c…`
   - `oracle-arena:appeals:v1` — `0x8e8ae43c…` (schema registered; publisher does **not** yet watch appeal events)

   **Publish:** `apps/sds-publisher/src/publisher.ts` watches `BountyBoard`, `ConsensusEngine`, `ResolverRegistry`, `Settlement` via `viem` `watchContractEvent`; writes via `sdk.streams.set` in [`publish.ts`](apps/sds-publisher/src/publish.ts). Details: [`docs/findings/sds-integration.md`](docs/findings/sds-integration.md).

   **Read:** [`apps/web/lib/sds/subscriptions.ts`](apps/web/lib/sds/subscriptions.ts) polls `sdk.streams.getByKey` every 15s. Without the publisher process, SDS badges and stats may be empty; on-chain reads still work.

4. **LI.FI pattern** — `LiFiAdapter` with swappable router. Testnet uses `MockLiFiRouter` (`0xCdAaa7C6…`); mainnet targets LI.FI diamond per [Somnia's LI.FI integration guide](https://docs.somnia.network/developer/building-dapps/cross-chain-swaps-and-bridging/integrating-the-li.fi-sdk). LI.FI does not support testnets ([docs.li.fi/sdk/testing-integration](https://docs.li.fi/sdk/testing-integration)). See [`docs/findings/lifi-integration.md`](docs/findings/lifi-integration.md).

5. **Sub-second finality** — Somnia testnet RPC and explorer confirm sub-second block times in practice; per-decision economics (micro-bounties, frequent reputation updates) are design rationale, not a separate benchmark in findings.

## Architecture

### Deployed contracts (Somnia testnet 50312)

Source of truth: [`packages/config/src/somnia.ts`](packages/config/src/somnia.ts).

| Contract | Address |
|----------|---------|
| BountyBoard v3 | `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290` |
| ResolverRegistry v4 | `0x0AcEF373884b7843592904e74F87ABD46ca035CF` |
| ConsensusEngine v2 | `0xB2495D336d59D193Fa2463b95248dE240aBfe6df` |
| Settlement | `0x1036E3837418695A6731405B8EBf954834508B5c` |
| ResolverPayoutPrefs | `0x9Af19D44e9E7880ea7a269c4cCD76aa01a40ABa8` |
| LiFiAdapter | `0xf00dDBc8319843c036BC2FA8162328377f154f7d` |
| MockLiFiRouter (testnet only) | `0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6` |
| AppealLayer (Phase 2) | `0x4d663617b176745667bb65954CE63D0a391a202c` |
| ResolverAgent A (CrossChain pref → Base) | `0x490B7B63301025CE2970b25F623Dbe963a13e60B` |
| ResolverAgent B (SomniaNative default) | `0xe4Faf7CeC814038BA09F0E177b37751d565bbFed` |
| ToolsChatProbe | `0x8bd481D5E202561A9aE09ff8Ab3E41D175F2B6f2` |

Foundry: **144 tests** across 11 suites (`contracts/test/`). CI runs `forge fmt --check`, `forge build`, `forge test` (`.github/workflows/ci.yml`).

### Frontend routes (`apps/web/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/marketplace` | Open bounties + activity |
| `/bounty/[id]` | Race timeline, verdicts, appeals panel |
| `/leaderboard` | Resolver rankings |
| `/post` | Wallet-connected `postBounty` |
| `/register` | Wallet-connected `registerAgent` |

Frontend deploy: Vercel (`apps/web/vercel.json`). No production URL is committed in this repo.

### SDS publisher (24/7 worker)

Long-lived Node process: `pnpm --filter @oracle-arena/sds-publisher start`. Render blueprint: [`render.yaml`](render.yaml). Deploy steps: [`apps/sds-publisher/DEPLOY.md`](apps/sds-publisher/DEPLOY.md).

**Limitation:** if the publisher is down, events during that window are not backfilled to SDS (on-chain data remains via RPC/explorer).

Schema registration tx (four original schemas): [0x60b98173…](https://shannon-explorer.somnia.network/tx/0x60b98173b2fea4b4fe90167ebe06d503e2354651d315617328eca041ee19006c) ([`docs/findings/sds-integration.md`](docs/findings/sds-integration.md)). SDS smoke test (bounty #2 post/cancel + read-back) is documented in the same file.

### Findings index (verified testnet evidence)

| Topic | Document |
|-------|----------|
| Full demo chain (bounty #4) | [`docs/findings/end-to-end-demo-flow.md`](docs/findings/end-to-end-demo-flow.md) |
| `inferToolsChat` decode + platform address | [`docs/findings/inferToolsChat.md`](docs/findings/inferToolsChat.md) |
| Settlement + MockLiFiRouter | [`docs/findings/settlement.md`](docs/findings/settlement.md) |
| LI.FI constraints + adapter | [`docs/findings/lifi-integration.md`](docs/findings/lifi-integration.md) |
| SDS schemas + event mapping | [`docs/findings/sds-integration.md`](docs/findings/sds-integration.md) |
| Resolver agents + Phase 2 reactive wake | [`docs/findings/resolveragent.md`](docs/findings/resolveragent.md) |
| Phase 2 sprint status | [`docs/phase2-sprint.md`](docs/phase2-sprint.md) |

## Tech stack

| Layer | Stack |
|-------|-------|
| Contracts | Solidity 0.8.20, Foundry |
| Frontend | Next.js 14 App Router, TypeScript, viem, wagmi, RainbowKit |
| Landing motion | GSAP (scroll sections) |
| Streaming | `@somnia-chain/streams` SDK |
| Config / types | `packages/config`, `packages/types` |
| CI | GitHub Actions — contracts + `pnpm lint` / `pnpm build` |

## Local development

### Prerequisites

- Node.js 20+, pnpm 9+, Foundry
- Wallet on Somnia testnet (50312) with STT
- [WalletConnect](https://cloud.reown.com) project ID for the web app

### Install

```bash
pnpm install
```

### Web

```bash
# apps/web/.env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

cd apps/web
pnpm dev
```

### Contracts

```bash
cd contracts
forge fmt --check
forge build
forge test
```

### SDS publisher (local smoke test)

```bash
pnpm sds-publish:setup-schemas   # once — idempotent
cd apps/sds-publisher
pnpm start
```

Env: see [`apps/sds-publisher/.env.example`](apps/sds-publisher/.env.example). Publisher key defaults to `contracts/.env` `PRIVATE_KEY` if `SDS_PUBLISHER_PRIVATE_KEY` is unset.

## Project structure

```
contracts/              # BountyBoard, ConsensusEngine, Settlement, ResolverAgent, AppealLayer, …
apps/web/               # Next.js frontend
apps/sds-publisher/       # SDS event listener + publish helpers
packages/config/        # Chain 50312 + deployed addresses (SSOT)
packages/types/         # Shared TS types (incl. SDS record shapes)
docs/findings/          # Verified testnet evidence (tx hashes, gas, root causes)
render.yaml             # Render Background Worker for SDS publisher
```

## Roadmap

### Phase 1 — shipped (Agentathon demo)

- Bounty post / escrow / cancel on testnet
- Two resolver agents with live `inferToolsChat` ([`docs/findings/inferToolsChat.md`](docs/findings/inferToolsChat.md))
- Consensus agree and disagree paths (bounties #4 and #1)
- Settlement + mock cross-chain payout (bounty #4)
- Race UI, marketplace, leaderboard
- SDS publisher + frontend read path ([`docs/findings/sds-integration.md`](docs/findings/sds-integration.md))

### Phase 2 — partial (in repo, not all E2E-proven)

| Item | Status |
|------|--------|
| Open resolver registration UI (`/register`) | Shipped |
| `AppealLayer` + slashing hooks | Deployed `0x4d663617…`, 6 tests, UI panel — **no live appeal flow in findings** |
| SDS `appeals:v1` schema | Registered — publisher does not watch appeal events yet |
| SDS publisher on Render | Config in `render.yaml` + `DEPLOY.md` — operator deploy |
| Multi-chain **inbound** bounty funding | Documented for mainnet; testnet stays native STT ([`docs/phase2-sprint.md`](docs/phase2-sprint.md)) |
| Mainnet LI.FI | Scaffold in `packages/config/src/somnia-mainnet.ts` — empty deploy addresses |
| Reactive `BountyPosted` agent wake | Not in `ResolverAgent.sol` |
| On-chain `StreamPublisher.sol` | Stub only |

Mainnet token addresses (from [`docs/findings/lifi-integration.md`](docs/findings/lifi-integration.md)): SOMI native `0x0000…0000`, WSOMI `0x046EDe95…`, USDC.e `0x28BEc7E3…`, USDT `0x67B302E3…`, WETH `0x936Ab8C6…`.

## Acknowledgments

- [Somnia](https://somnia.network) — testnet, agents platform, Data Streams
- [Encode Club](https://encode.club) — Somnia Agentathon (June 2026)
- [LI.FI](https://li.fi) — cross-chain integration pattern (mainnet)

## License

MIT — see [LICENSE](./LICENSE).
