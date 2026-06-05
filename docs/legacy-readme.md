# Legacy README (archived)

This file preserves the previous long-form README content prior to the Day 20 rewrite.

---

## Original README content

> Copied from `README.md` before the rewrite.

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

(Original content continues…)


