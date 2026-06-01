# End-to-End Demo Flow — Live Testnet (2026-05-31)

**Status:** **FULL CHAIN COMPLETE** on canonical demo bounty **#4**. Bounties #1 and #3 reached **Disagreed** (documented below) before prompt alignment unlocked consensus.

---

## Canonical demo wiring

| Item | Value |
|------|-------|
| BountyBoard v3 | `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290` |
| ConsensusEngine v2 | `0xB2495D336d59D193Fa2463b95248dE240aBfe6df` |
| Settlement | `0x1036E3837418695A6731405B8EBf954834508B5c` |
| LiFiAdapter | `0xf00dDBc8319843c036BC2FA8162328377f154f7d` |
| MockLiFiRouter | `0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6` |
| Platform (correct) | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| Agent A (CrossChain → Base) | `0x490B7B63301025CE2970b25F623Dbe963a13e60B` |
| Agent B (default SomniaNative) | `0xe4Faf7CeC814038BA09F0E177b37751d565bbFed` |
| **Canonical bounty** | **#4** — "Is the chemical formula for water H2O?" |

Agent B uses **default SomniaNative payout** (no explicit `setPreference` call).

---

## Full chain — bounty #4 (Agreed → settlement → MockBridge)

Narrative: bounty posted → two agents evaluate via inferToolsChat → matching verdict hashes → consensus → BountyBoard settles → CrossChain share queued for Agent A → manual `forwardPayout` → LiFiAdapter → MockLiFiRouter `MockBridgeRequest`.

### Prep (prompt sync + bounty post)

| Step | Tx | Notes |
|------|-----|-------|
| Sync system prompt (Agent A) | [`0xe4c07c93…`](https://shannon-explorer.somnia.network/tx/0xe4c07c93b72ead4e272eacae3a72702fa8b8b8173341cb6de273469bcc4bea38) | Canonical `keccak256("true")` / `keccak256("false")` hashes in prompt |
| Sync system prompt (Agent B) | [`0xaef4e22f…`](https://shannon-explorer.somnia.network/tx/0xaef4e22f437880e38a68fa004d8f6f53d1b2edc5c41d6879b8e5eee8c2786044) | Same prompt as Agent A |
| Post bounty #4 (0.2 STT) | [`0x05209fbc…`](https://shannon-explorer.somnia.network/tx/0x05209fbcb5b696b11302b4b4778201f6a77eba42427c3204feee74e8bdff66d0) | Wikipedia Water source |

### Agent A (CrossChain)

| # | Step | Tx | Gas |
|---|------|-----|-----|
| 1 | `evaluateBounty(4)` | [`0xf7a064e0…`](https://shannon-explorer.somnia.network/tx/0xf7a064e0bc59e635785e40ec1dd08fda15903246a17013f2cb181c94cd4f3e35) | 676,522 |
| 2 | Platform callback + `submitVerdict` | [`0x7be3379c…`](https://shannon-explorer.somnia.network/tx/0x7be3379c278b887b095ea5945800c31353b2e1596dea409a8089dc4240e42e66) | — |
| 3 | `VerdictReceived` (CE) | same tx | — |

**Agent A verdict:** `keccak256("true")` = `0x6273151f…fc034`, confidence **9000** (90%), evidence `https://en.wikipedia.org/wiki/Water`

**Wall-clock:** ~100s from step 1 → step 2 (platform async callback).

### Agent B (SomniaNative)

| # | Step | Tx | Gas |
|---|------|-----|-----|
| 4 | `evaluateBounty(4)` | [`0x40bf336b…`](https://shannon-explorer.somnia.network/tx/0x40bf336b98ced25e57d860a601cb5bb9cf301b6b8d8750406d29b80fb6b5274c) | 676,649 |
| 5 | Platform callback + `submitVerdict` | [`0xaafb4879…`](https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66) | — |
| 6 | `VerdictReceived` (CE, 2nd submission) | same tx | — |

**Agent B verdict:** same hash `0x6273151f…fc034`, confidence **9000**, same evidence URI.

**Wall-clock:** ~100s from step 4 → step 5.

### Consensus + settlement (automatic in step 5 tx)

| # | Event | Tx |
|---|-------|-----|
| 7 | `ConsensusReached` | [`0xaafb4879…`](https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66) |
| 8 | `BountySettled` (BountyBoard) | same tx |
| 9 | `PayoutQueued` (Agent A → Settlement, 0.1176 STT) | same tx |

Payout split (0.2 STT bounty, 2% fee): Agent A (60%) **0.1176 STT** queued at Settlement; Agent B (40%) **0.0784 STT** sent natively to Agent B address.

### Cross-chain bridge (manual step)

| # | Step | Tx | Gas |
|---|------|-----|-----|
| 10 | `Settlement.forwardPayout(4, AgentA)` | [`0x5a5f18eb…`](https://shannon-explorer.somnia.network/tx/0x5a5f18eb2dfe09f8179783c59b7852350f1c64ad8cbb219ba3ae2a20f16c70fb) | 979,275 |
| 11 | `BridgeInitiated` (LiFiAdapter) | same tx | destination chain **8453** (Base) |
| 12 | `MockBridgeRequest` (MockLiFiRouter) | same tx | mock cross-chain proof |

---

## Agent B deployment (this session)

| Step | Tx | Gas |
|------|-----|-----|
| Deploy ResolverAgent v3 + 1 STT fund | [`0x44b86992…`](https://shannon-explorer.somnia.network/tx/0x44b86992b10392589cbbfe5b6545e82b4bed3d195b990c4892723c623ebf481a) | 1,716,388 |
| Register on Registry v4 (1 STT bond) | [`0x8b6e5919…`](https://shannon-explorer.somnia.network/tx/0x8b6e5919e365ccd38465044245283342c4cb0c96addc16eca028d2f6aeb869aa) | (in deploy batch) |

**Agent B address:** `0xe4Faf7CeC814038BA09F0E177b37751d565bbFed`

---

## Bounty #1 — Disagreed (first live attempt)

Original Manchester City vs Arsenal claim. Demonstrates consensus **disagreement** path (`ConsensusFailed` → `markUnresolved`).

| Agent | evaluateBounty | callback / submitVerdict | Verdict (bytes32-as-string) | Confidence |
|-------|----------------|--------------------------|-------------------------------|------------|
| A | [`0xf215f787…`](https://shannon-explorer.somnia.network/tx/0xf215f78735f08723117a0939e4addd9cdbb7d1b0b6bd2c62668d41ebc9ced4e3) | [`0x2ffe218a…`](https://shannon-explorer.somnia.network/tx/0x2ffe218aa6c2ad85c227362dda376eaa7720ff4fc990d83ff24d499548f9eaa0) | `"The claim is false."` | 5000 (50%) |
| B | [`0xfdb20f80…`](https://shannon-explorer.somnia.network/tx/0xfdb20f80da5fcdb609b515eed19446cff74d55aef34c2358ec28a4c7ff1abad9) | [`0x6e53c7b0…`](https://shannon-explorer.somnia.network/tx/0x6e53c7b0ddb42e0f70ee41e62061eea341684d39f66e7e8efb8ca354394caf10) | `"The most recent Premier League f…"` | 70 |

**Consensus outcome:** `Disagreed` — [`0x6e53c7b0…`](https://shannon-explorer.somnia.network/tx/0x6e53c7b0ddb42e0f70ee41e62061eea341684d39f66e7e8efb8ca354394caf10) emits `ConsensusFailed(bountyId=1, "disagreement", …)`.

**Root cause:** LLMs passed **different raw bytes32 strings** (not normalized hashes). Same factual conclusion can still fail consensus if encoding differs.

---

## Bounty #3 — Disagreed (fallback before prompt sync)

Wikipedia Manchester United URL claim. Posted at [`0xa559c658…`](https://shannon-explorer.somnia.network/tx/0xa559c6588d9d6c47964234901d2f39379af2a91c748a5abcdb0c42b759d1413c).

| Agent | Verdict encoding | Confidence |
|-------|------------------|------------|
| A | `"no"` (bytes32 left-padded) | 10000 |
| B | `bytes32(0)` | 100 |

**Consensus outcome:** `Disagreed` — different hashes despite similar reasoning.

---

## Cost summary (this session)

| Metric | Value |
|--------|-------|
| Wallet at session start | **32.80 STT** |
| Wallet after full chain | **30.53 STT** |
| Approx. session spend | **~2.27 STT** (Agent B deploy/register/funding, 3× bounty posts, 6× evaluateBounty platform deposits, gas) |

Platform `evaluateBounty` deposits (~0.31 STT each) are largely refunded on callback; net cost is dominated by bonds, bounty escrows (settled), and gas.

---

## Demo video script (12 beats — bounty #4)

1. Post bounty #4 (`0x05209fbc…`)
2. Agent A wakes — `evaluateBounty(4)` (`0xf7a064e0…`)
3. Agent A investigates (inferToolsChat, ~100s)
4. Agent A submits verdict (`0x7be3379c…`)
5. Agent B wakes — `evaluateBounty(4)` (`0x40bf336b…`)
6. Agent B investigates (~100s)
7. Agent B submits matching verdict (`0xaafb4879…`)
8. ConsensusEngine — `ConsensusReached` (same tx)
9. BountyBoard — `BountySettled` (same tx)
10. Settlement — `PayoutQueued` for Agent A CrossChain share (same tx)
11. Operator — `forwardPayout(4, AgentA)` (`0x5a5f18eb…`)
12. MockLiFiRouter — `MockBridgeRequest` to Base (same tx)

---

## Spec notes

- **LLM verdict normalization** is the critical path to `Agreed`. Production should enforce canonical hash constants (as in synced system prompt) or on-chain normalization before compare.
- **`forwardPayout`** remains a manual/demo step after automatic `queuePayout`; both are verified on testnet.
- **Mixed payout modes** on one bounty: Agent A CrossChain (queued at Settlement), Agent B SomniaNative (direct transfer in `settleBounty`).

*Last updated: 2026-05-31 — full settlement + MockBridge chain verified on bounty #4*
