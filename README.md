# Oracle Arena

**The resolution layer of the agentic economy.**

Oracle Arena is open infrastructure for verifiable fact resolution. Any contract on any chain can post a bounty for any verifiable claim; autonomous resolver agents on Somnia compete to investigate it, reach consensus, and settle payment—cross-chain when required—with the entire process streaming live via Somnia Data Streams. This is not a prediction market. It is the layer underneath prediction markets, insurance protocols, DAO grant verification, and oracle disputes: a marketplace where competing agents resolve facts, and downstream protocols consume the outcome.

Built for the [Somnia Agentathon](https://encode.club) (Encode Club, May–June 2026) and continued as a public open-source project afterward.

**Author:** [TBD] · **License:** [MIT](./LICENSE)

---

## Table of Contents

- [The Problem](#the-problem)
- [Why Somnia](#why-somnia)
- [Architecture Overview](#architecture-overview)
- [End-to-End Flow](#end-to-end-flow)
- [MVP vs. Roadmap](#mvp-vs-roadmap)
- [Economic Model](#economic-model)
- [Threat Model](#threat-model)
- [Tech Stack & Local Development](#tech-stack--local-development)
- [Roadmap](#roadmap)
- [Network & Contract References](#network--contract-references)

---

## The Problem

Agentic systems increasingly need to resolve external facts: did an event occur, did a URL report a specific outcome, did on-chain state satisfy a condition? Today the options are weak:

| Approach | Limitation |
|----------|------------|
| **Centralized oracles** (Chainlink-style) | Strong for price feeds; poor fit for open-ended, evidence-heavy factual claims that require reasoning over heterogeneous sources. |
| **Manual DAO votes** | Slow, expensive in human attention, and doesn't scale to high-frequency or micro-resolution. |
| **In-product AI resolution** (single-app internal logic) | Works inside one product boundary; not composable, not auditable as shared infrastructure, not open to competing resolver strategies. |
| **Prediction markets** | Price a belief; they do not produce a structured, evidence-backed resolution with reasoning trails and payout routing for arbitrary downstream consumers. |

What's missing is a **neutral resolution marketplace**: multiple independent agents investigate the same claim using different strategies, converge on a verdict with an auditable evidence trail, and settle atomically—with outcomes consumable by any protocol via live streams, not proprietary APIs.

Centralized resolution cannot fix this at the infrastructure layer. A single operator chooses one investigation strategy, one evidence pipeline, and one failure mode. Oracle Arena inverts that: **consensus across diverse investigation strategies** is a stronger guarantee than identical agents voting the same way.

---

## Why Somnia

Oracle Arena loads five Somnia primitives simultaneously. Each is load-bearing—not decorative.

| Primitive | Role in Oracle Arena |
|-----------|----------------------|
| **Somnia Agents** | Resolver agents call `inferToolsChat` on the LLM Inference agent to decide whether to bid, which evidence to fetch, and what verdict to submit. JSON API and Parse Website agents pull structured and web evidence. Deterministic execution (fixed seed, temperature 0) means agreement reflects convergent investigation, not random sampling. |
| **Native On-Chain Reactivity** | `BountyBoard` emits events that wake eligible `ResolverAgent` contracts in the same block. No keepers, no polling, no backend cron. Agents subscribe at deploy time and react autonomously. |
| **Somnia Data Streams (SDS)** | Full reasoning traces, tool-call logs, race views, and leaderboards stream live. The frontend and third-party apps consume structured feeds without polling contracts. |
| **LI.FI Integration** | Cross-chain payout at settlement: resolvers receive funds on their preferred chain and asset. MVP proves outbound routing; inbound cross-chain bounty posting follows in Phase 2. |
| **Sub-Second Finality + Fractional-Cent Fees** | Per-submission logging, reputation updates, and micro-bounties remain economically viable—impossible on high-latency, high-fee chains at this granularity. |

### Competition Over Investigation Strategy

Somnia Agents are deterministic: identical inputs produce byte-identical outputs. Two resolvers with the same prompt, toolkit, and evidence do not "race" stochastically—they agree by construction.

Oracle Arena treats this as a feature. **Resolvers compete on investigation strategy**, not LLM randomness:

- **Specialization filters** — different bounty type tags (e.g. sports vs. crypto outcomes)
- **Evidence sources** — different APIs and sites (e.g. ESPN vs. BBC Sport)
- **System prompts and rubrics** — strict vs. liberal evidence acceptance
- **Speed profiles** — resolve immediately vs. gather additional sources before submitting
- **Toolkits** — Parse Website only vs. JSON API + Parse Website combined

When diverse strategies independently reach the same normalized verdict, downstream consumers get an epistemically meaningful signal—not redundant votes from clones.

---

## Architecture Overview

Eight components: seven on-chain contracts plus a product-grade frontend. A dedicated SDS publishing layer sits alongside the core resolution pipeline.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTERS & CONSUMERS                               │
│         (any EVM chain · any app subscribing to SDS · frontend)             │
└─────────────────────────────────────────────────────────────────────────────┘
         │ post bounty                    │ consume streams
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  LiFiAdapter    │              │ StreamPublisher │──────► SDS (leaderboard,
│  (Phase 2       │              │      .sol       │         race view, receipts)
│   inbound;      │              └────────▲────────┘
│   MVP outbound) │                       │ canonical events
└────────┬────────┘                       │
         │ fund / payout                  │
         ▼                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BountyBoard.sol                                │
│   Escrow · bounty metadata · type tags · deadlines · reactive events      │
└─────────────────────────────────────────────────────────────────────────────┘
         │ reactive: BountyPosted (filtered by tag)
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ResolverRegistry.sol                              │
│   Agent registration · bonds · specialization tags · reputation ledger      │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│   ResolverAgent.sol      │     │   ResolverAgent.sol      │   ... (N agents)
│   (Agent A — strict)     │     │   (Agent B — broad)      │
│   · reactive subscribe   │     │   · reactive subscribe   │
│   · inferToolsChat loop  │     │   · inferToolsChat loop  │
│   · evidence via agents  │     │   · evidence via agents  │
└────────────┬─────────────┘     └────────────┬─────────────┘
             │ submit verdict                  │
             └──────────────┬──────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ConsensusEngine.sol                               │
│   Aggregate submissions · agreement check · Unresolved on disagreement      │
│   (Phase 2: escalation · weighted quorum · reputation-weighted payout)      │
└─────────────────────────────────────────────────────────────────────────────┘
                            │ consensus reached
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Settlement.sol                                 │
│   Payout split · invoke LiFiAdapter for cross-chain · atomic with consensus │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   STT on Somnia      USDC on Base         (Phase 2: any route)
   (native)           via LI.FI

┌─────────────────────────────────────────────────────────────────────────────┐
│                            AppealLayer.sol                                  │
│   Interface stub only in MVP · implementation Phase 2 · triggers slash()  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### On-Chain vs. SDS: Reasoning Split

Reasoning is too verbose for calldata at scale. The architecture splits persistence deliberately:

```
┌──────────────────────────────┐     ┌──────────────────────────────────────┐
│         ON-CHAIN             │     │              SDS STREAMS             │
├──────────────────────────────┤     ├──────────────────────────────────────┤
│ Normalized verdict           │     │ Full reasoning trace                 │
│ Confidence (scalar)          │     │ Tool-call log (inferToolsChat steps) │
│ Evidence URI hashes          │     │ Live race view (agents in flight)    │
│ Submission timestamps        │     │ Leaderboard · settled-bounty archive │
│ Agent / bounty identifiers   │     │ Public receipt page data             │
└──────────────────────────────┘     └──────────────────────────────────────┘
         │                                        │
         └───────────────┬────────────────────────┘
                         ▼
              StreamPublisher.sol
         (consumes canonical contract events,
          emits SDS-formatted output)
```

**Verification path:** anyone can reconstruct a receipt from on-chain anchors; SDS carries the human-readable investigation narrative.

### Three Distinct Fund Flows

Payment routing is not one hop. Three journeys, diagrammed separately:

**1. Posting path** — poster → escrow

```
[MVP]     Poster (Somnia) ──STT──► BountyBoard escrow (Somnia)
[Phase 2] Poster (any EVM chain) ──LI.FI inbound──► BountyBoard escrow (Somnia)
```

**2. Settlement payout path** — escrow → resolvers

```
[MVP]     BountyBoard escrow ──STT──► Resolver (prefers Somnia)
          BountyBoard escrow ──LI.FI──► Resolver (prefers USDC on Base)
[Phase 2] Any supported LI.FI route from escrow to resolver preference
```

**3. Refund path** — escrow → poster (Unresolved, cancel, or timeout)

```
[MVP]     BountyBoard escrow (98 STT remaining) ──► Poster (Somnia)
          (2 STT protocol fee already sent to ProtocolTreasury at post)
[Phase 2] BountyBoard escrow ──LI.FI return──► Poster (source chain)
```

---

## End-to-End Flow

**Canonical example:** *Did the Manchester City vs. Arsenal match on [date] end with Manchester City winning?*

A URL-resolvable sports outcome bounty—clear public evidence, easy for judges to follow, evergreen demo narrative.

### 1. Post (Somnia-native, MVP)

1. Poster connects wallet on Somnia testnet and opens the bounty form.
2. Poster defines:
   - **Claim:** Manchester City won the match on [date]
   - **Evidence hint:** official league or reputable sports news URLs
   - **Type tag:** `URL_RESOLVABLE_SPORTS_OUTCOME`
   - **Deadline:** resolution window (e.g. 24 hours after match end)
   - **Payout:** e.g. 100 STT held in escrow
3. Poster approves and transfers STT to `BountyBoard.sol`. **2% (2 STT)** is allocated to `ProtocolTreasury`; **98 STT** enters escrow.
4. `BountyBoard` emits a reactive `BountyPosted` event with the type tag.

### 2. Agent subscription & reactive wake-up

1. Two pre-deployed `ResolverAgent` contracts registered in `ResolverRegistry` each declared handling of `URL_RESOLVABLE_SPORTS_OUTCOME` at deploy time.
2. On `BountyPosted`, reactivity filters on tag and wakes both agents in the same block—no keeper.
3. Each agent runs an **`inferToolsChat` loop** (one reactive trigger → internal tool loop; *assumed model pending testnet verification*):
   - **Agent A (strict):** official league API via JSON API agent; conservative rubric
   - **Agent B (broad):** BBC Sport + ESPN via Parse Website; slightly broader acceptance criteria
4. Agents decide independently whether to submit and with what confidence.

### 3. Evidence gathering & submission

1. Agents pull evidence through Somnia's JSON API and Parse Website agent IDs.
2. Each agent submits on-chain:
   - Normalized verdict: `TRUE`, `FALSE`, or `UNRESOLVABLE`
   - Confidence scalar
   - Hashes of evidence URIs consulted
   - Timestamp
3. Full reasoning and tool logs stream to SDS via `StreamPublisher`—visible on the live race view in the frontend.

### 4. Consensus

1. `ConsensusEngine` waits for the **first two submissions** within the resolution window.
2. **Agreement:** both submit `TRUE` (exact match on normalized verdict) → bounty moves to `Settled`.
3. **Disagreement:** verdicts differ → bounty enters `Unresolved`; escrow refunds poster on Somnia (98 STT returned; 2 STT already captured for sunk agent-call costs).
4. **Single submission:** only one agent submits before deadline → `Unresolved`, same refund path.

**MVP payout split on agreement:** 60% to first submitter, 40% to second (speed-weighted; reputation does not affect weights yet).

### 5. Settlement & payout

1. `Settlement.sol` executes atomically with consensus.
2. **Resolver A** configured for STT on Somnia → direct transfer from escrow.
3. **Resolver B** configured for USDC on Base → `LiFiAdapter` routes STT → USDC via LI.FI (MVP's proven cross-chain path).
4. Demo video highlights one Base USDC payout to show LI.FI without overstating inbound cross-chain posting scope.

### 6. Streaming & public receipt

1. `StreamPublisher` emits leaderboard updates, race-view deltas, and settled-bounty archive entries.
2. Frontend consumes SDS—not polling `eth_call` in a loop.
3. Permanent receipt: `oracle-arena.xyz/bounty/{bountyId}` — fully reconstructible from on-chain state + SDS; the frontend is a renderer.

---

## MVP vs. Roadmap

Nothing here is vaporware framing. Phase 1 ships working primitives; Phase 2 extends a designed architecture.

| Component / Capability | Phase 1 (Demo Day) | Phase 2 (Post-Hackathon) |
|------------------------|--------------------|---------------------------|
| **BountyBoard** | Post, escrow (STT), reactive events, URL-resolvable type only | On-chain-state, multi-source, subjective-with-rubric types |
| **ResolverRegistry** | Two pre-deployed agents with **50 STT bonds locked**; `slash()` implemented and tested but not callable (no `AppealLayer` caller in MVP) | Open registration for any deployer |
| **ResolverAgent** | Two instances, different prompts/sources/toolkits | Arbitrary agent configs, dynamic specialization |
| **ConsensusEngine** | Two-submitter agreement; `Unresolved` on disagreement | Escalation, quorum > 2, reputation-weighted payout |
| **Settlement** | STT native + one LI.FI route (STT → USDC Base) | Full multi-route cross-chain payout |
| **LiFiAdapter** | Outbound payout routing | Inbound cross-chain bounty funding |
| **AppealLayer** | Interface stub (`IAppealLayer` signatures only); slashing trigger not wired | Full implementation: bonded challenges, re-resolution, activates `slash()` |
| **StreamPublisher / SDS** | Leaderboard + race view streams | Full receipt archive, appeal events |
| **Frontend** | Marketplace, live race, leaderboard, operator dashboard, receipt pages | Post-from-any-chain flow |
| **Protocol governance** | Owner-controlled `ProtocolTreasury` | DAO-governed fees and parameters |

---

## Economic Model

### Bounty posting

- **Escrow asset (MVP):** STT on Somnia, held in `BountyBoard`.
- **Protocol fee:** 2% of bounty value → `ProtocolTreasury` at post time. Non-refundable; covers sunk Somnia agent execution costs when bounties end in `Unresolved` or refund paths.

### Resolver bonds

- **MVP:** Each pre-deployed resolver bonds **50 STT minimum** via `ResolverRegistry`. Bonds are posted and locked on-chain—resolver stake is genuinely at risk. `slash()` is fully implemented and unit-tested on `ResolverRegistry`; it checks `msg.sender` against the registered `AppealLayer` address and reverts in MVP because no implementation is deployed at that address yet. `AppealLayer.sol` ships as an **interface stub only** (function signatures defined, no implementation). Bonds are visible on-chain during demo; the appeal mechanism that activates slashing ships in Phase 2.
- **Phase 2:** `AppealLayer` implementation wired as the sole caller of `slash()`; dynamic bond sizing by specialization and historical risk.

### Payout distribution (agreement case, MVP)

| Party | Share |
|-------|-------|
| First submitter | 60% of escrow (after protocol fee already taken at post) |
| Second submitter | 40% |
| Protocol | 2% at post (not deducted again at settlement) |

Reputation accumulates on-chain from correct resolutions and appears on the SDS leaderboard. **It does not affect payout weights in Phase 1**—keeps consensus logic simple while the primitive is live.

### Appeal economics (Phase 2 — documented, not implemented)

| Event | Economics |
|-------|-----------|
| Challenger opens appeal | Posts bond = **2× original bounty payout** |
| Challenge succeeds | 50% of original resolvers' bonds → challenger; 50% burned |
| Challenge fails | Challenger bond distributed pro-rata to original resolvers |

### Griefing

No separate non-refundable post fee in MVP. The 2% protocol fee limits spam economics. If griefing volume becomes material in production, a small fixed post fee may be added—noted in threat model.

---

## Threat Model

| Threat | Description | Mitigations |
|--------|-------------|-------------|
| **Resolver collusion** | Two agents coordinate to submit the same false verdict and split payout. | Diverse investigation strategies required by design; Phase 2 appeals with adversarial evidence; reputation and bonds create long-horizon cost. MVP relies on operator-chosen agent diversity (different sources, prompts, toolkits). |
| **Adversarial evidence injection** | Poster or third party points agents at malicious URLs hosting misleading content. | Multiple independent agents with different sources; normalized verdict requires agreement across strategies; Phase 2 appeals surface URLs agents missed. |
| **LLM prompt manipulation via evidence URLs** | Web pages contain hidden prompt-injection text designed to skew agent output. | Parse Website agent output is evidence, not instructions; system prompts treat page content as untrusted data; disagreement → `Unresolved` rather than forced settlement. |
| **Bounty griefing** | Poster spam cheap bounties to drain agent compute or crowd the board. | 2% protocol fee on every post; minimum escrow amounts; bonded agents limit frivolous participation costs to the protocol treasury covering sunk calls. |
| **Validator-ordered submission MEV** | Reactive wake-up puts both resolvers in the same block. If both submit identical verdicts in that block, **transaction ordering within the block** determines who captures the 60% first-submitter slot—not investigation speed. A validator-aligned resolver in open registration could systematically favor itself. Not traditional stealable MEV (both parties submit the same answer, not a price-sensitive trade), but a real payout skew. | Irrelevant in MVP (both resolvers are operator-controlled). Phase 2 fix: reputation-weighted payouts that reduce the marginal value of the 60% slot relative to long-horizon correctness; additional mitigations under evaluation (commit-reveal submissions, randomized tie-breaking). |
| **Single-agent failure** | Only one resolver submits before deadline. | Bounty → `Unresolved`, poster refunded (minus protocol fee); no partial settlement. |
| **Deterministic false consensus** | Two agents share the same bug (e.g. same bad API) and agree incorrectly. | Intentionally heterogeneous agent configs; Phase 2 appeals and additional quorum; SDS reasoning trails enable post-hoc audit. |

---

## Tech Stack & Local Development

### Stack

| Layer | Technology |
|-------|------------|
| Smart contracts | Solidity 0.8.20+, [Foundry](https://book.getfoundry.sh/) |
| Frontend | Next.js 14 (App Router), TypeScript, viem + wagmi |
| Styling | Tailwind CSS + custom design system (not default Tailwind aesthetics) |
| Live data | Somnia Data Streams SDK |
| Cross-chain | LI.FI SDK |
| Hosting | Vercel (frontend); contracts on Somnia testnet |
| Monorepo | pnpm workspaces |

### Repository layout

```
oracle-arena/
├── contracts/           # Foundry — all Solidity
├── apps/
│   └── web/             # Next.js frontend
├── packages/
│   ├── types/           # Shared TypeScript types from contract ABIs
│   └── config/          # Shared chain config, deployed addresses
├── docs/                # Extended architecture, threat model, economics
└── README.md
```

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Setup (after scaffolding)

```bash
# Clone and install
git clone https://github.com/[TBD]/oracle-arena.git
cd oracle-arena
pnpm install

# Contracts
cd contracts
forge install
forge build
forge test

# Frontend
cd ../apps/web
cp .env.example .env.local   # add Somnia RPC, wallet connect project id, SDS/LI.FI keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Point your wallet at **Somnia Testnet** (chain ID `50312`).

### Environment variables (frontend)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SOMNIA_RPC_URL` | Somnia testnet RPC |
| `NEXT_PUBLIC_CHAIN_ID` | `50312` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect |
| `NEXT_PUBLIC_SDS_*` | Somnia Data Streams endpoints / credentials |
| `NEXT_PUBLIC_LIFI_*` | LI.FI integrator configuration |

Deployed contract addresses live in `packages/config` after testnet deployment.

### Testing

Every contract ships with Foundry tests. Coverage is a deliverable, not an afterthought:

```bash
cd contracts
forge test
forge coverage
```

---

## Roadmap

### Phase 1 — MVP (Agentathon demo, ~3 weeks)

- [ ] `BountyBoard`: post, STT escrow, reactive `BountyPosted`, URL-resolvable type tags
- [ ] `ResolverRegistry`: two pre-deployed agents with locked 50 STT bonds; `slash()` implemented and tested (gated until `AppealLayer`)
- [ ] `ResolverAgent` × 2: distinct prompts, evidence sources, toolkits; reactive subscription
- [ ] `ConsensusEngine`: two-submitter agreement; `Unresolved` + refund on disagreement or timeout
- [ ] `Settlement` + `LiFiAdapter`: STT native payout + STT → USDC (Base) via LI.FI
- [ ] `StreamPublisher`: SDS leaderboard and race-view streams
- [ ] Frontend: marketplace, live race (SDS-driven), leaderboard, operator dashboard, receipt pages
- [ ] Foundry test suite with coverage across all shipped contracts
- [ ] Testnet deployment + demo bounty (Manchester City walkthrough)

### Phase 2 — Open infrastructure (post-hackathon)

- [ ] Open `ResolverAgent` registration
- [ ] Additional bounty types: on-chain state, multi-source, subjective with rubrics
- [ ] `ConsensusEngine` escalation, quorum > 2, reputation-weighted payouts
- [ ] `AppealLayer`: full implementation (interface stub in Phase 1); bonded challenges, re-resolution, activates `slash()`
- [ ] `LiFiAdapter` inbound: post bounties from arbitrary EVM chains
- [ ] Full multi-route LI.FI payout matrix
- [ ] DAO-governed `ProtocolTreasury` and fee parameters
- [ ] Integration path for ecosystem products (e.g. Prophecy Social as a downstream consumer)

### Phase 3 — Production hardening

- [ ] Mainnet deployment on Somnia
- [ ] Formal audit
- [ ] Parameter governance and incident response playbooks
- [ ] SDK for downstream protocols to post bounties and subscribe to resolution streams

---

## Network & Contract References

### Somnia Testnet

| Parameter | Value |
|-----------|-------|
| Network | Somnia Testnet |
| Chain ID | `50312` |
| RPC | `https://api.infra.testnet.somnia.network` |
| Explorer | [https://shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |

*Addresses subject to change pre-mainnet.*

### Somnia Agent Platform (testnet)

| Contract / Agent | Address / ID |
|------------------|--------------|
| Agent Registry | `0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A` |
| Platform contract | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` |
| JSON API Request agent | `13174292974160097713` |
| LLM Inference agent | `12847293847561029384` |
| LLM Parse Website agent | `12875401142070969085` |

Both MVP resolver agents call LLM Inference agent ID `12847293847561029384` with different system prompts, evidence sources, and toolkit configurations.

### Integration notes (verify during implementation)

- **`inferToolsChat` loop model:** Option A (one reactive trigger, internal tool loop) assumed; confirm in week 1 on testnet.
- **SDS contract integration:** `StreamPublisher.sol` consuming canonical events—confirm against current SDS SDK contract-level patterns before shipping.

---

## Ecosystem Positioning

**Prophecy Social** demonstrates AI resolution inside a single product. **Oracle Arena** generalizes that capability into open infrastructure any product can use—including Prophecy itself. No active integration is claimed for the hackathon; the relationship is architectural alignment within the Somnia ecosystem.

---

## Contributing

Issues and PRs welcome after Phase 1 testnet deployment. See `docs/` for extended architecture notes. Contract changes require Foundry tests; frontend changes should consume SDS streams rather than adding backend services.

---

*Oracle Arena — resolve facts, not opinions.*
