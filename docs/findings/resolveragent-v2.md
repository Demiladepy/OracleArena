# ResolverAgent v2 — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). v2 routes verdict submission through ConsensusEngine v2. Canonical demo bounty posted.

---

## 1. Summary

ResolverAgent v2 is a **targeted wiring change** from v1: successful LLM decode path now calls `consensusEngine.submitVerdict(...)` instead of `bountyBoard.recordSubmission(...)`.

Everything else unchanged: `evaluateBounty` still calls `platform.createRequest`, bounty reads still use `bountyBoard.getBounty()`, mock `_decodeAgentResponse` (hypothesis A) remains until inferToolsChat probe succeeds.

---

## 2. Diff vs v1

| Aspect | v1 | v2 |
|--------|----|----|
| Verdict path | `bountyBoard.recordSubmission(bountyId, address(this), …)` | `consensusEngine.submitVerdict(bountyId, verdictHash, confidence, evidenceUri)` |
| Constructor | `(platform, bountyBoard, registry, operator, …)` | Adds `consensusEngine_` after `registry_` |
| Immutables | No CE reference | `ConsensusEngine public immutable consensusEngine` |
| BountyBoard | Read + write | Read only (via CE for writes) |

---

## 3. Test results

| Metric | Value |
|--------|-------|
| Tests | 29 passing (`ResolverAgentTest`) |
| Mock | `MockConsensusEngine.sol` forwards to `board.recordSubmission` for unit tests |

```bash
cd contracts
forge test --match-contract ResolverAgentTest
```

---

## 4. Deployed address (testnet — current)

| Field | Value |
|-------|-------|
| **Contract** | `ResolverAgent` v2 |
| **Address** | `0xb01e811a0caEd38ccaB4670Df02bEC0E280A9e74` |
| **Deploy tx** | [`0x3a2e806a…`](https://shannon-explorer.somnia.network/tx/0x3a2e806af73b4adcffeb6c23361d91acdcaaacc4f1818ba76493e17e8cc09864) |
| **Deploy gas** | **28,828,062** (+ 1 STT initial funding) |
| **Registration tx** | [`0xcb115eb4…`](https://shannon-explorer.somnia.network/tx/0xcb115eb4a5bed0bd7912692654d56418860a7b9ce3bf63f1313a092302188c79) |
| **Registration gas** | **696,500** (1 STT bond) |
| **CrossChain pref tx** | [`0x675f8930…`](https://shannon-explorer.somnia.network/tx/0x675f893035029257efd9eddd9ca58666803e631e40505f584b0c7cc0bd253ad9) |
| **Pref-set gas** | **1,716,388** (Base 8453, recipient = deployer) |

### Constructor wiring

| Parameter | Value |
|-----------|-------|
| `platform_` | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` |
| `bountyBoard_` | `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290` (v3) |
| `registry_` | `0x0AcEF373884b7843592904e74F87ABD46ca035CF` (v4) |
| `consensusEngine_` | `0xB2495D336d59D193Fa2463b95248dE240aBfe6df` (v2) |
| `operator_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` |
| Initial funding | 1 STT |

Deploy script: `contracts/script/DeployFullDemoAgent.s.sol`

---

## 5. Canonical demo bounty

| Field | Value |
|-------|-------|
| **Bounty ID** | **1** |
| **Post tx** | [`0xf2e36f36…`](https://shannon-explorer.somnia.network/tx/0xf2e36f366242a16c8cbd3d69ed3e3954f5a67f2e3777eee58225b9a7be5e3410) |
| **Post gas** | **3,191,104** |
| **Claim** | Did Manchester City beat Arsenal in their most recent Premier League fixture? |
| **Source** | `https://www.bbc.com/sport/football/teams/manchester-city` |
| **Deadline** | 6 days from post |
| **Payout** | 0.2 STT |
| **Board** | BountyBoard v3 |
| **Assigned agent** | ResolverAgent v2 (registered, not auto-assigned) |

Config: `packages/config/src/somnia.ts` → `demoConfig`.

---

## 6. evaluateBounty on demo bounty #1

**Result:** Reverts — platform subcommittee still offline (`AgentRequester: not enough active members`).

`evaluateBounty` **does** reach `platform.createRequest` in simulation before platform revert. Mock decoder remains in place. Full end-to-end resolution blocked until Somnia LLM Inference subcommittee restores validators.

Script: `contracts/script/EvaluateDemoBounty.s.sol` (fork sim only; no successful broadcast).

---

## 7. Mock decoder status

inferToolsChat probe re-attempted 2026-05-25 — **still blocked**. See `docs/findings/inferToolsChat.md` §2.

ResolverAgent continues using hypothesis A mock decoder:

```solidity
abi.decode(raw, (string, uint256, bytes))  // reasoning, toolId, callData
```

Swap to verified 6-tuple when probe returns real callback bytes.

---

## 8. Superseded deployments

| Agent | Address | Notes |
|-------|---------|-------|
| v1 (Settlement phase) | `0x0f99957287c25313afC7eC3978eDAE3a97A72269` | `recordSubmission` path — in `legacyAddresses.resolverAgentV1Settlement` |
| v1 (Registry phase) | `0x2CBb5d1384b4f20242303509b55CA104B6da12f2` | See `resolveragent.md` |

---

*Last updated: 2026-05-25 — ResolverAgent v2 live, demo bounty #1 posted*
