# BountyBoard — Deployment & Verification Findings

**Status:** Implementation and tests complete. **Testnet deployment pending** — no funded `PRIVATE_KEY` in environment at verification time (2026-05-25).

---

## 1. Summary

`BountyBoard.sol` is the escrow and lifecycle contract for Oracle Arena bounties. Posters deposit native STT; the ConsensusEngine records submissions, settles winners (2% protocol fee), or marks bounties unresolved. Events are the wire format for future reactive subscribers and SDS.

---

## 2. Test results

| Metric | BountyBoard.sol |
|--------|-----------------|
| Tests | 34 passing (`BountyBoardTest`) |
| Line coverage | **96.60%** (142/147) — meets >95% target |
| Branch coverage | **95.78%** (159/166) — meets >95% target |
| Function coverage | 81.58% (31/38) |
| Compiler | Solidity 0.8.20, `via_ir = true` (required for `string[]` calldata → storage) |

Run locally:

```bash
cd contracts
forge test --match-contract BountyBoardTest
forge coverage --match-contract BountyBoard --report summary --ir-minimum
```

---

## 3. Deployed address (testnet)

| Field | Value |
|-------|-------|
| **Contract** | `BountyBoard` |
| **Address** | **PENDING** — run deployment script |
| **Deployment tx** | **PENDING** |
| **Network** | Somnia Testnet (chain ID `50312`) |
| **RPC** | `https://api.infra.testnet.somnia.network` |
| **Explorer** | `https://shannon-explorer.somnia.network` |

### Constructor args (MVP placeholders)

| Parameter | MVP testnet value |
|-----------|-------------------|
| `protocolTreasury_` | Deployer address (via `PROTOCOL_TREASURY` env or default) |
| `consensusEngine_` | Deployer address (via `CONSENSUS_ENGINE` env or default) |

Replace `consensusEngine_` when `ConsensusEngine.sol` is deployed.

### Deployment commands

```bash
cd contracts
# .env: PRIVATE_KEY, optional PROTOCOL_TREASURY, CONSENSUS_ENGINE
forge script script/DeployBountyBoard.s.sol:DeployBountyBoard \
  --rpc-url https://api.infra.testnet.somnia.network \
  --broadcast -vvv

# Smoke test: post + cancel sample bounty
BOUNTY_BOARD_ADDRESS=0x... forge script script/VerifyBountyBoard.s.sol:VerifyBountyBoard \
  --rpc-url https://api.infra.testnet.somnia.network \
  --broadcast -vvv
```

---

## 4. Gas costs (local Foundry estimates)

Approximate gas from test suite (not testnet gas price):

| Operation | Gas (approx) |
|-----------|----------------|
| Deploy `BountyBoard` | ~3.5M (viaIR compile/deploy) |
| `postBounty` (1 evidence source) | ~320k |
| `postBounty` (5 sources) | Scales with string storage — isolate on testnet |
| `cancelBounty` | ~326k |
| `recordSubmission` | ~480k (first submission) |
| `settleBounty` | ~712k |
| `markUnresolved` | ~368k–624k |

Record exact testnet gas after broadcast from transaction receipts.

---

## 5. Spec deviations and README deltas

### Intentional interface expansion

The scaffolded `IBountyBoard` from Phase 1 scaffolding was **replaced** to match this phase's spec:

- Added: `cancelBounty`, `recordSubmission`, `settleBounty`, expanded events, `BountyStatus` enum (Open/Submitted/Resolved/Unresolved/Cancelled)
- Removed: `markSettled`, `getEscrowBalance`, fee-at-post model

### README vs implementation: protocol fee timing

| README (original) | This implementation |
|-------------------|---------------------|
| 2% fee deducted **at post** | 2% fee deducted on **`settleBounty`** and **`markUnresolved`** only |
| Cancel refunds 98% | Cancel refunds **100%** (no fee on cancel) |

**Recommendation:** Update README economic model to match implementation, or change contract to fee-at-post in a follow-up (would affect escrow accounting).

### Bounty type tag

| README example | Implementation constant |
|----------------|-------------------------|
| `URL_RESOLVABLE_SPORTS_OUTCOME` | `URL_RESOLVABLE_FACT` = `keccak256("URL_RESOLVABLE_FACT")` |

Reactive subscribers should filter on `URL_RESOLVABLE_FACT` until Phase 2 adds more types.

### `HasSubmissions` error

Defined in spec but **unreachable** with current flow: first submission moves status `Open → Submitted`, so cancel hits `BountyNotOpen` before `HasSubmissions`. Kept for spec compliance if lifecycle changes later.

---

## 6. Event wire format (load-bearing)

```solidity
event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 indexed bountyType, string claim, string[] evidenceSources, uint64 deadline, uint256 payout);
event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refunded);
event SubmissionRecorded(uint256 indexed bountyId, address indexed resolver, bytes32 verdictHash, uint16 confidence, string evidenceUri, uint64 submittedAt);
event BountySettled(uint256 indexed bountyId, bytes32 winningVerdictHash, address[] winners, uint256[] payoutShares, uint256 feeAmount);
event BountyUnresolved(uint256 indexed bountyId, uint256 refundedToPoster, uint256 feeAmount);
```

Downstream: frontend, `StreamPublisher`, reactive filters must treat these as frozen API.

---

## 7. Platform quirks

- **`via_ir` required** for assigning `string[] calldata` to storage in `postBounty`.
- **Shannon explorer event indexing** for dynamic `string[]` in events — verify after testnet post (may show hashed/ABI-encoded form in UI).
- **No ERC20** — native STT only; contract accepts plain `payable` and `receive()`.

---

## 8. Notes for next phase (ResolverRegistry / ResolverAgent)

1. **ConsensusEngine** must be deployed and set as `consensusEngine` immutable — current MVP uses deployer placeholder.
2. **`recordSubmission`** stores `verdictHash` (bytes32), not enum — ConsensusEngine normalizes verdicts before hashing.
3. **Deadline enforcement** is on-chain in `recordSubmission`; agents waking late cannot submit.
4. **`getOpenBounties`** is O(n) over all bounties — fine for MVP; index off-chain or add indexer for scale.
5. **Fee model change** from README — align docs before demo to avoid judge confusion.

---

*Last updated: 2026-05-25*
