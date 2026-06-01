# BountyBoard — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). Open bounty #2 awaiting resolution.

---

## 1. Summary

`BountyBoard.sol` is the escrow and lifecycle contract for Oracle Arena bounties. Posters deposit native STT; the ConsensusEngine records submissions, settles winners (2% protocol fee), or marks bounties unresolved. Events are the wire format for future reactive subscribers and SDS.

---

## 2. Test results

| Metric | BountyBoard.sol |
|--------|-----------------|
| Tests | 34 passing (`BountyBoardTest`) |
| Line coverage | **96.60%** (142/147) |
| Branch coverage | **95.78%** (159/166) |
| Compiler | Solidity 0.8.20, `via_ir = true` (required for `string[]` calldata → storage) |

---

## 3. Deployed address (testnet)

| Field | Value |
|-------|-------|
| **Contract** | `BountyBoard` |
| **Address** | `0xcf812e4735CeA2a5d966ad2999e982b2ED623092` |
| **Network** | Somnia Testnet (chain ID `50312`) |
| **RPC** | `https://api.infra.testnet.somnia.network` |
| **Explorer** | [Shannon Explorer — contract](https://shannon-explorer.somnia.network/address/0xcf812e4735CeA2a5d966ad2999e982b2ED623092) |

### Constructor args (MVP placeholders)

| Parameter | Testnet value | Notes |
|-----------|---------------|-------|
| `protocolTreasury_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` (deployer) | **Placeholder** — update when ProtocolTreasury deploys |
| `consensusEngine_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` (deployer) | **Placeholder** — update when ConsensusEngine deploys |

### Transaction hashes (`deploy-testnet.ps1` successful run)

| Step | Tx hash | Status | Gas used |
|------|---------|--------|----------|
| Deploy BountyBoard | [`0x750b70cd1a2bba7efcafd666c8cc3f06f60300918027be4ca276d6209d17957b`](https://shannon-explorer.somnia.network/tx/0x750b70cd1a2bba7efcafd666c8cc3f06f60300918027be4ca276d6209d17957b) | Success | **24,751,444** |
| Smoke: `postBounty` (bounty #1) | [`0x9dbde85fbd8789831b6999e5aa63c684f0ad22ce6833a46c2a57bd81d840566a`](https://shannon-explorer.somnia.network/tx/0x9dbde85fbd8789831b6999e5aa63c684f0ad22ce6833a46c2a57bd81d840566a) | Success | **2,980,666** |
| Smoke: `cancelBounty` (bounty #1) | [`0x9cab7b54a57a0c60ea7679f2f3d0fd9855cc27f1a5188ce28abb4cdd0c011073`](https://shannon-explorer.somnia.network/tx/0x9cab7b54a57a0c60ea7679f2f3d0fd9855cc27f1a5188ce28abb4cdd0c011073) | Success | **62,949** |
| Post open bounty (#2) | [`0x33cd1689b826430e950dbbbf59fac735fed0d1b8f2af045506f8130ad2c73b34`](https://shannon-explorer.somnia.network/tx/0x33cd1689b826430e950dbbbf59fac735fed0d1b8f2af045506f8130ad2c73b34) | Success | **2,980,666** |

**Failed txs during debugging (do not use):**

| Tx hash | Issue |
|---------|-------|
| `0xe2ab388a…`, `0x4614fb96…`, `0xce68e166…` | BountyBoard CREATE OOG at ~2.15M / ~6.6M gas (default forge estimate) |
| `0x006cc6c6…` | `cancelBounty` OOG at 961,940 gas when bundled with `postBounty` in one script |

### Live open bounty

| Field | Value |
|-------|-------|
| **bountyId** | `2` |
| **Claim** | "Did Manchester City beat Arsenal in their most recent Premier League fixture?" |
| **Evidence** | `https://www.bbc.com/sport/football/teams/manchester-city` |
| **Payout** | 0.2 STT |
| **Type** | `URL_RESOLVABLE_FACT` (`0xa33c8d070672fcb09b8793d4f6476727b2eba9543cf0baeff41db1aae1211dd0`) |
| **Status** | Open (`0`) |

---

## 4. Gas costs — local vs testnet

Effective gas price on successful txs: **6 gwei** (`6000000000` wei).

| Operation | Local Foundry (avg) | Somnia testnet (receipt) | Ratio (testnet / local) |
|-----------|---------------------|--------------------------|-------------------------|
| Deploy `BountyBoard` | ~3.5M (compile artifact) | **24,751,444** | ~7× vs naive deploy estimate |
| `postBounty` (1 source) | ~324,458 | **2,980,666** | **~9.2×** |
| `cancelBounty` | ~28,295 | **62,949** | **~2.2×** |

Simulation gas inside scripts (`gasleft()` deltas) understates on-chain usage even further (~334k simulated vs 2.98M on-chain for post).

---

## 5. ⚠️ Somnia / via_ir gas multiplier (load-bearing)

**Finding:** Somnia testnet execution gas for `via_ir` contracts is **far above** Foundry's default `--gas-estimate-multiplier` (130% = 1.3×). Underestimation causes CREATE/CALL txs to hit their gas limit and revert with `status: 0` while consuming the full limit.

**Working forge flags (`deploy-testnet.ps1`):**

| Tx type | `--gas-estimate-multiplier` | Notes |
|---------|----------------------------|-------|
| Contract CREATE (`via_ir`) | **2000** (~20×) | BountyBoard deploy succeeded at ~24.75M gas |
| Single CALL (`postBounty`, `cancelBounty`, etc.) | **8000** (~80×) | Use **separate forge script invocations** per tx when a script has multiple broadcasts — otherwise gas is allocated proportionally and later txs OOG |

**Rule of thumb for this repo:** treat Somnia testnet gas as **~10–20× local Foundry estimates** for `via_ir` contracts until Somnia/Foundry documents official behavior.

---

## 6. Shannon explorer — `BountyPosted` event indexing

Inspected [`0x33cd1689…`](https://shannon-explorer.somnia.network/tx/0x33cd1689b826430e950dbbbf59fac735fed0d1b8f2af045506f8130ad2c73b34) (open bounty #2):

| Field | Explorer behavior |
|-------|-------------------|
| **Indexed topics** | `bountyId`, `poster`, `bountyType` decode cleanly in topics |
| **Dynamic `string claim`** | Stored in log `data` as ABI-encoded bytes (770-byte payload) — **not rendered as human-readable text in the default log view** |
| **`string[] evidenceSources`** | Same — nested ABI encoding inside `data`; decodable off-chain via standard `BountyPosted` ABI, but **not auto-expanded in Shannon UI** |

**Conclusion:** reactive subscribers and indexers must decode log `data` themselves. Do not rely on Shannon explorer to display `claim` or `evidenceSources` as readable fields.

Raw log decode (RPC) confirms correct encoding: claim length `0x2f` (47 chars), one evidence URL `https://example.com/...` / BBC URL on bounty #2.

---

## 7. Spec deviations and README deltas

### Protocol fee timing

| README (original) | Implementation |
|-------------------|----------------|
| 2% fee at post | 2% on `settleBounty` / `markUnresolved` only |
| Cancel refunds 98% | Cancel refunds **100%** |

### Bounty type tag

| README example | Deployed constant |
|----------------|-------------------|
| `URL_RESOLVABLE_SPORTS_OUTCOME` | `URL_RESOLVABLE_FACT` = `keccak256("URL_RESOLVABLE_FACT")` |

### `HasSubmissions` error

Defined in spec but unreachable with current lifecycle (cancel hits `BountyNotOpen` after first submission).

---

## 8. Event wire format (frozen API)

```solidity
event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 indexed bountyType, string claim, string[] evidenceSources, uint64 deadline, uint256 payout);
event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refunded);
event SubmissionRecorded(uint256 indexed bountyId, address indexed resolver, bytes32 verdictHash, uint16 confidence, string evidenceUri, uint64 submittedAt);
event BountySettled(uint256 indexed bountyId, bytes32 winningVerdictHash, address[] winners, uint256[] payoutShares, uint256 feeAmount);
event BountyUnresolved(uint256 indexed bountyId, uint256 refundedToPoster, uint256 feeAmount);
```

---

## 9. Notes for ResolverRegistry / ResolverAgent

1. **ConsensusEngine** placeholder on BountyBoard = deployer — must be updated before production settlement flow.
2. **`URL_RESOLVABLE_FACT`** is the live bounty type on testnet bounty #2.
3. **`getOpenBounties`** is O(n) — fine for MVP.
4. Use **gas multipliers above** for all future `via_ir` testnet deploys.

---

*Last updated: 2026-05-25 — testnet deployment verified*
