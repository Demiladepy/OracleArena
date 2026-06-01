# ResolverAgent — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). Smoke-test agent deployed and registered on ResolverRegistry v2.

---

## 1. Summary

`ResolverAgent.sol` is the autonomous resolver contract: reads bounties from `BountyBoard`, calls Somnia `inferToolsChat` via the agent platform, handles async callbacks, and (in MVP mocks) decodes LLM tool responses to submit verdicts.

**Platform constraint:** Somnia LLM Inference subcommittee was offline during prior probes. `_decodeAgentResponse` is **mocked per hypothesis A** (`abi.decode(raw, (string, uint256, bytes))`) in an isolated function — swap when `docs/findings/inferToolsChat.md` confirms the verified response shape.

**Interface note:** Does **not** implement the locked `IResolverAgent.sol` scaffold (`investigateBounty`, `submitVerdict`, etc.). Implements `IAgentRequesterHandler` with `evaluateBounty` + `handleResponse` instead — see §8.

---

## 2. Test results

| Metric | ResolverAgent.sol |
|--------|-------------------|
| Tests | 29 passing (`ResolverAgentTest`) |
| Line coverage | **99.15%** (116/117) |
| Branch coverage | **86.36%** (19/22) |
| Function coverage | **100.00%** (21/21) |

```bash
cd contracts
forge test --match-contract ResolverAgentTest
forge coverage --match-contract ResolverAgent --report summary --ir-minimum
```

### Coverage gaps (honest)

| Uncovered | Reason |
|-----------|--------|
| 1 line (`_uintToString` `value == 0` early return) | No valid bounty path produces deadline `0` in message builder after deadline validation |
| 3 branches | Mostly `_supportsType` multi-tag loop tails and `_uintToString` edge — require artificial fixtures with minimal benefit |

`handleResponse` success/failure/decode paths are covered via `MockAgentPlatform`. Live platform callback cannot be integration-tested until subcommittee returns.

---

## 3. Deployed address (testnet — current)

| Field | Value |
|-------|-------|
| **Contract** | `ResolverAgent` |
| **Address** | `0x2CBb5d1384b4f20242303509b55CA104B6da12f2` |
| **Deployment tx** | [`0x1317c0c1adbc79f9f21c0b2bc0f2539db7808fa2ac92e614e984672b9654fada`](https://shannon-explorer.somnia.network/tx/0x1317c0c1adbc79f9f21c0b2bc0f2539db7808fa2ac92e614e984672b9654fada) |
| **Gas used (deploy + 1 STT funding)** | **28,639,322** |
| **Registration tx** | [`0xbed669ed68b1de7a0d37004ba25c285cb89367780fa574f06a842d22bd500ada`](https://shannon-explorer.somnia.network/tx/0xbed669ed68b1de7a0d37004ba25c285cb89367780fa574f06a842d22bd500ada) |
| **Registration gas** | **1,712,292** |
| **Registry bond** | 1 STT (`MIN_BOND` on v2 registry) |

### Constructor wiring

| Parameter | Value |
|-----------|-------|
| `platform_` | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` |
| `bountyBoard_` | `0xcf812e4735CeA2a5d966ad2999e982b2ED623092` |
| `registry_` | `0x0F29c7ED799F8Bfac1E2dAF425911a4054f0a88B` |
| `operator_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` |
| `supportedTypes_` | `[URL_RESOLVABLE_FACT]` |
| Initial funding | 1 STT |

---

## 4. Superseded smoke deploy (wrong BountyBoard)

| Field | Value |
|-------|-------|
| **Address** | `0xA86a346d747AF65456a971931e2d308bF98f8C12` |
| **Deploy tx** | [`0x82052133823a8b5666bbda94de4f9f21ffa6c6e09b2c364a669605337d4f87ab`](https://shannon-explorer.somnia.network/tx/0x82052133823a8b5666bbda94de4f9f21ffa6c6e09b2c364a669605337d4f87ab) |
| **Issue** | Stale `BOUNTY_BOARD_ADDRESS` env in shell pointed at wrong board; `evaluateBounty(2)` reverted `BountyDoesNotExist(2)` |
| **Registration tx** | [`0xbbd0765fac72d1c58410ff0cd48a8ef7249e58a15a43703bccc7da1baffa0101`](https://shannon-explorer.somnia.network/tx/0xbbd0765fac72d1c58410ff0cd48a8ef7249e58a15a43703bccc7da1baffa0101) — still registered on v2 registry but **do not use** |

`deploy-resolver-agent-testnet.ps1` now pins `BOUNTY_BOARD_ADDRESS` to the canonical board.

---

## 5. Live testnet probes

### `evaluateBounty(2)` on bounty #2 (open, 0.2 STT)

**Agent:** `0x2CBb5d1384b4f20242303509b55CA104B6da12f2`  
**Result:** Reverts inside platform `createRequest` — **not** a ResolverAgent logic failure.

```
Error(string): "AgentRequester: not enough active members"
```

Revert data (ABI-encoded string): `0x08c379a0…` decoding to the message above.

This matches the known Somnia LLM Inference subcommittee outage documented in `inferToolsChat.md`. ResolverAgent successfully validated the bounty and reached the platform call before the platform rejected subcommittee formation.

### `handleResponse`

Cannot be tested on live testnet until platform returns a real callback. Fully covered in unit tests via `MockAgentPlatform`.

### `recordSubmission` on live BountyBoard

Even when the platform recovers, `bountyBoard.recordSubmission` from ResolverAgent will revert **`NotConsensusEngine`** until ConsensusEngine deploys (BountyBoard gates `msg.sender == consensusEngine`). Works in mocks only for MVP.

---

## 6. Gas costs

| Operation | Local Foundry (avg) | Somnia testnet |
|-----------|---------------------|----------------|
| Deploy `ResolverAgent` (+ 1 STT) | — | **28,639,322** |
| `registerAgent` (ResolverAgent) | ~391k (simulated) | **1,712,292** |
| `fund()` | ~22k | Not probed on testnet |
| `evaluateBounty` | ~1.1M (mock platform) | Reverts at platform (no gas receipt for static call) |
| `withdrawEarnings` | ~28k | Not probed on testnet |

Use **`--gas-estimate-multiplier 2000`** for CREATE, **`8000`** for CALLs.

---

## 7. Mock decoder (`_decodeAgentResponse`)

```solidity
/// MOCKED — assumes hypothesis A pending Somnia platform recovery.
(reasoning, toolId, callData) = abi.decode(rawResult, (string, uint256, bytes));
```

When `inferToolsChat.md` confirms the verified shape, change **only this function** and redeploy.

`decodeAndSubmit` is `external` (callable only by `address(this)`) to allow `try/catch` in `handleResponse` without bricking the agent on malformed payloads.

---

## 8. Spec deviations (surfaced — not silent)

| Spec | Implementation | Notes |
|------|----------------|-------|
| `IResolverAgent` interface | **Not implemented** | Uses `evaluateBounty` / `handleResponse` / `IAgentRequesterHandler` instead of `investigateBounty` / `submitVerdict` |
| Direct `recordSubmission` in MVP | Calls `BountyBoard.recordSubmission` | Reverts on live board until ConsensusEngine; mock board used in tests |
| `creditEarnings(uint256)` | Added, operator-only | Not in original spec; supports earnings ledger testing / future payout wiring |
| `_decodeAgentResponse` | Mocked hypothesis A | Documented; pending platform recovery |

---

## 9. Next steps (post-review — not started)

1. ConsensusEngine deploy + wire BountyBoard `consensusEngine` (or redeploy board)
2. Replace mock decoder after live `inferToolsChat` probe succeeds
3. Deploy second ResolverAgent once first completes full E2E on recovered platform
4. Phase 2: reactive `BountyPosted` subscription

---

*Last updated: 2026-05-25*
