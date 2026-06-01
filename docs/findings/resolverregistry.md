# ResolverRegistry — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** — v2 with testnet-friendly `MIN_BOND` (2026-05-25).

---

## 1. Summary

`ResolverRegistry.sol` registers resolver agents with locked STT bonds, stores specialization type tags, maintains a structured reputation ledger, and implements withdrawal + slash flows. `slash()` is gated on `appealLayer`, which is **`address(0)` in MVP** — production calls revert with `NotAppealLayer`.

**v2 change:** `MIN_BOND` is a constructor argument (`immutable`) instead of a hard-coded 50 STT constant. Testnet deploy uses **1 STT** to stay within faucet budgets while registering multiple agents and posting bounties. **Production target remains 50 STT**, set via constructor at deployment time.

---

## 2. Test results

| Metric | ResolverRegistry.sol |
|--------|----------------------|
| Tests | 31 passing (`ResolverRegistryTest`) |
| Line coverage | **99.00%** (99/100) |
| Branch coverage | **100.00%** (23/23) |
| Function coverage | **100.00%** (18/18) |

```bash
cd contracts
forge test --match-contract ResolverRegistryTest
forge coverage --match-contract ResolverRegistry --report summary --ir-minimum
```

---

## 3. v1 deployment — DEPLOYED, SUPERSEDED

| Field | Value |
|-------|-------|
| **Contract** | `ResolverRegistry` v1 |
| **Address** | `0x520a8466d4616c9d8b3f23B98fD4f8AA50500D8B` |
| **Deployment tx** | [`0x77c1f8a193344b8f81460e4a0872882c239a5d6f35d791bd29b1603480c3d73e`](https://shannon-explorer.somnia.network/tx/0x77c1f8a193344b8f81460e4a0872882c239a5d6f35d791bd29b1603480c3d73e) |
| **Gas used (deploy)** | **16,200,618** |
| **MIN_BOND** | 50 STT (hard-coded constant) |

**Why superseded:** Deployer wallet had ~48.9 STT after deploy. `registerAgent` requires ≥50 STT per agent — could not register a single test agent. Test agent registration was **blocked** on v1.

---

## 4. v2 deployment — current (MIN_BOND = 1 STT)

| Field | Value |
|-------|-------|
| **Contract** | `ResolverRegistry` v2 |
| **Address** | `0x0F29c7ED799F8Bfac1E2dAF425911a4054f0a88B` |
| **Deployment tx** | [`0xa32262b1e65f873a81e943ec6acb435c4570045c6ef16599b2ff275b59dffb10`](https://shannon-explorer.somnia.network/tx/0xa32262b1e65f873a81e943ec6acb435c4570045c6ef16599b2ff275b59dffb10) |
| **Gas used (deploy)** | **16,376,714** |
| **Network** | Somnia Testnet (chain ID `50312`) |

### Constructor args (MVP placeholders)

| Parameter | Testnet value | Notes |
|-----------|---------------|-------|
| `consensusEngine_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` | **Placeholder** — only this address can call `updateReputation` until ConsensusEngine deploys |
| `owner_` | `0x0C503557CC81701037240e982c9520Aa1ffca4Cc` | Can call `setAppealLayer` **once** (Phase 2) |
| `minBond_` | **1 STT** (`1000000000000000000` wei) | **Testnet override** via `MIN_BOND_WEI` env var. Production target: 50 STT |

### On-chain MVP gates verified

| Check | Value |
|-------|-------|
| `appealLayer()` | `0x0000000000000000000000000000000000000000` |
| `slash()` in production | Reverts `NotAppealLayer` |
| `MIN_BOND()` | **1 STT** (`1000000000000000000` wei) |

### Rationale

Testnet `MIN_BOND` lowered to enable end-to-end testing within faucet allocation (register ≥2 agents, post bounties, fund ResolverAgent inferToolsChat deposits). Production target remains **50 STT**, set via constructor at deployment time — not a compromise, an explicit deployment-time parameter.

---

## 5. Test registration (placeholder agents)

Type tag: `URL_RESOLVABLE_FACT` = `0xa33c8d070672fcb09b8793d4f6476727b2eba9543cf0baeff41db1aae1211dd0`

| Agent placeholder | Address | Registration tx | Gas used |
|-------------------|---------|-----------------|----------|
| Agent A | `0x1111111111111111111111111111111111111111` | [`0x42db23899284971a39b935d0a2d1955aeb32bcf76b00825b0ea82ef22df80486`](https://shannon-explorer.somnia.network/tx/0x42db23899284971a39b935d0a2d1955aeb32bcf76b00825b0ea82ef22df80486) | **2,113,316** |
| Agent B | `0x2222222222222222222222222222222222222222` | [`0x100e6bb520b125ac86c5595aee818551bad6dbb31565af53c8a257f340c4e512`](https://shannon-explorer.somnia.network/tx/0x100e6bb520b125ac86c5595aee818551bad6dbb31565af53c8a257f340c4e512) | **1,712,292** |

Bond per agent: **1 STT** (matches v2 `MIN_BOND()`).

---

## 6. Gas costs

| Operation | Local Foundry (avg) | Somnia testnet |
|-----------|---------------------|----------------|
| Deploy `ResolverRegistry` v2 | — | **16,376,714** |
| `registerAgent` (Agent A) | ~391k (simulated) | **2,113,316** |
| `registerAgent` (Agent B) | ~391k (simulated) | **1,712,292** |
| `requestWithdrawal` | ~270k | Unit tests only |
| `completeWithdrawal` | ~340k | Unit tests only |
| `slash` | ~347k | Unit tests only (appealLayer set in tests) |

Use **`--gas-estimate-multiplier 2000`** for CREATE, **`8000`** for CALLs (see `bountyboard.md` §5).

Deploy script reads `MIN_BOND_WEI` (defaults to `1e18` / 1 STT) and logs the value on deploy.

---

## 7. Interface change from scaffold

The Phase 1 scaffold `IResolverRegistry` (simple `uint256` reputation score, `int256 delta`, `BondSlashed` event) was **replaced** with the locked MVP spec:

- Structured `Reputation` struct + `AgentStatus` lifecycle
- `operator` distinct from `agent` address
- Withdrawal delay (24h) + bond refund path
- `AgentSlashed` / `AppealLayerSet` events
- `getAgentsForTypeTag` pagination
- **`MIN_BOND` as constructor `immutable`** (v2)

---

## 8. Notes for ResolverAgent

1. Real `ResolverAgent` registered on v2 — see `resolveragent.md`.
2. `updateReputation` caller is deployer placeholder — ConsensusEngine must be deployed and registry **re-deployed** (immutable `consensusEngine`) or accept deployer-only reputation updates in MVP demo.
3. `isActive()` helper for ConsensusEngine eligibility checks.
4. Duplicate type tags in registration array are **deduplicated** (documented behavior).

---

*Last updated: 2026-05-25*
