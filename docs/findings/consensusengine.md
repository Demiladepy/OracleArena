# ConsensusEngine — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). Full foundation stack wired via Option A redeploy.

---

## 1. Summary

`ConsensusEngine.sol` aggregates resolver submissions (max 2), compares `verdictHash` values, and triggers `BountyBoard.settleBounty` (agreement) or `markUnresolved` (disagreement / expiry). It is the **only** contract that may call `recordSubmission`, `settleBounty`, and `markUnresolved` on the live board.

`markExpired(uint256)` closes single-submission bounties past deadline — prevents stranded `Submitted` state.

---

## 2. Design choice: Option A (immutable redeploy)

**Chosen:** Option A — redeploy BountyBoard v2 + ResolverRegistry v3 + ConsensusEngine with correct immutables. Superseded addresses preserved in `legacyAddresses`.

**Rejected:** Option B — one-time `setConsensusEngine` setter on existing contracts. Would introduce a mutable pathway into already-deployed immutables pattern.

**Circular wiring solved via CREATE nonce prediction** in `DeployConsensusPhase.s.sol`: deploy Board (nonce n) → Registry (n+1) → Engine (n+2), with Board/Registry constructed using predicted Engine address and Engine constructed with predicted Board/Registry addresses.

---

## 3. Test results

| Metric | ConsensusEngine.sol |
|--------|---------------------|
| Tests | 18 passing (`ConsensusEngineTest`) |
| Line coverage | **97.44%** (76/78) |
| Branch coverage | **73.33%** (11/15) |
| Function coverage | **100.00%** (10/10) |

```bash
cd contracts
forge test --match-contract ConsensusEngineTest
forge coverage --match-contract ConsensusEngine --report summary --ir-minimum
```

### Coverage gaps (honest)

| Uncovered | Reason |
|-----------|--------|
| 2 lines | Defensive `InvalidPayoutShares` revert — unreachable when `secondShare = distributable - firstShare` |
| 4 branches | `ConsensusAlreadyFinalized` on `markExpired` when 2 submissions exist; constructor zero-check edge |

Branch target (>95%) not met; line target (>95%) **met**.

---

## 4. Deployed addresses (current stack)

| Contract | Address |
|----------|---------|
| **ConsensusEngine** | `0x0e5789E15081411A1048D5B4915cd6F20d66a0c8` |
| **BountyBoard v2** | `0x14aB2e6C33A0CFd4747aFc9D4bA4D3D6Cbbc81cE` |
| **ResolverRegistry v3** | `0xa9AD0687076c9d99250C961d0E41914448DB823b` |
| **ResolverAgent** (redeployed) | `0x0f99957287c25313afC7eC3978eDAE3a97A72269` |

### Deployment transactions (atomic phase deploy)

| Step | Tx hash | Gas used |
|------|---------|----------|
| BountyBoard v2 CREATE | [`0x2570c481…`](https://shannon-explorer.somnia.network/tx/0x2570c481a2ed57de364cc172f03523298dc38ab98bc16df80405a543025291cc) | **24,760,404** |
| ResolverRegistry v3 CREATE | [`0x83eaf820…`](https://shannon-explorer.somnia.network/tx/0x83eaf820e9a7d9d2718ea75096cb95dfb046f08249691dd13cf85776c971bcf7) | **16,376,714** |
| ConsensusEngine CREATE | [`0x7b0f2fc4…`](https://shannon-explorer.somnia.network/tx/0x7b0f2fc4c95092e0310ba2ec862809ce7592f3286dfb24e5b30ea8fbe12de4c0) | **22,273,395** |

### Follow-on transactions

| Step | Tx hash | Gas used |
|------|---------|----------|
| ResolverAgent deploy (+ 1 STT fund) | [`0x43ed635e…`](https://shannon-explorer.somnia.network/tx/0x43ed635e6f9fbbe39c296562c47468bcebc4d48e57f97cb7254dee22294fb825) | **28,639,322** |
| Register ResolverAgent (1 STT bond) | [`0xb10b9cfa…`](https://shannon-explorer.somnia.network/tx/0xb10b9cfaf26a4868ebb6a47db55719f633fceb516b3147933e1443f7529b4439) | **2,113,316** |
| Post open bounty #1 (0.2 STT) | [`0x43bf90f3…`](https://shannon-explorer.somnia.network/tx/0x43bf90f3c82d6350d9d0c43932d4017694e7a2c5c78ec6886efb4af0b89937af) | **3,195,712** (+ 0.2 STT escrow) |

---

## 5. Open bounty (demo)

| Field | Value |
|-------|-------|
| **BountyBoard** | v2 `0x14aB…81cE` |
| **Bounty ID** | **1** |
| **Claim** | Manchester City vs Arsenal (same as v1 placeholder) |
| **Payout** | 0.2 STT |
| **Type** | `URL_RESOLVABLE_FACT` |

v1 bounty #2 on `0xcf812e…3092` is **stranded** (acceptable historical artifact).

---

## 6. evaluateBounty(1) probe

**Agent:** `0x0f99957287c25313afC7eC3978eDAE3a97A72269`  
**Result:** Reverts at platform layer (expected):

```
Error(string): "AgentRequester: not enough active members"
```

Agent successfully read bounty #1 from BountyBoard v2 and reached `platform.createRequest`. Subcommittee still offline.

---

## 7. Payout math (60/40)

Post-fee distributable: `payout - (payout * 200 / 10000)`

- `firstShare = distributable * 6000 / 10000` (round down)
- `secondShare = distributable - firstShare` (remainder — any wei dust goes to second submitter)

Submission order determines 60% recipient: first `submitVerdict` call gets index 0. Same-block tiebreak follows transaction ordering (documented, tested).

---

## 8. Spec deviations

| Item | Notes |
|------|-------|
| Legacy `IConsensusEngine.sol` | **Not implemented** — new API: `submitVerdict(bountyId, verdictHash, confidence, evidenceUri)` |
| ResolverAgent address changed | **Required redeploy** — `bountyBoard` and `registry` are immutables on ResolverAgent; re-registering `0x2CBb…` on v3 registry would not wire evaluateBounty to v2 board |
| ResolverAgent verdict path | Still calls `bountyBoard.recordSubmission` directly in MVP mock callback — **must switch to `ConsensusEngine.submitVerdict`** in next ResolverAgent update for live consensus |
| `WireRegistry.s.sol` | Deploys fresh Registry v3; immutables require full redeploy (not an in-place wire) |

---

## 9. Wallet burn rate

| | Wei | STT (approx) |
|--|-----|--------------|
| Balance before phase | 42,324,198,566,000,000,000 | **42.32** |
| Balance after phase | 39,540,656,716,000,000,000 | **39.54** |
| Phase spend | 2,783,541,850,000,000,000 | **~2.78** (gas + 1 STT bond + 1 STT agent fund + 0.2 STT bounty) |

Headroom remains comfortable for Settlement phase. Request faucet top-up if balance drops below **20 STT**.

---

## 10. Legacy addresses

See `packages/config/src/somnia.ts` → `legacyAddresses`:

- `bountyBoardV1` — consensusEngine was deployer placeholder; bounty #2 stranded
- `resolverRegistryV1` / `v2` — superseded MIN_BOND / consensusEngine wiring
- `resolverAgentV1` — pointed at pre-v2 board/registry

---

*Hard stop — Settlement is next phase.*

*Last updated: 2026-05-25*
