# Somnia Data Streams — Integration Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). External TypeScript EOA publisher service operational; four schemas registered; smoke test verified read-back.

---

## 1. Architecture decision

**Chosen:** `apps/sds-publisher/` — a long-lived Node.js TypeScript service using `@somnia-chain/streams`.

**Not chosen:** On-chain `StreamPublisher.sol` bridge contract.

| Factor | TypeScript publisher | On-chain publisher |
|--------|---------------------|-------------------|
| Contract redeploys | None — BountyBoard v3, CE v2, Settlement, Registry v4 unchanged | Requires deploy + wiring |
| Schema iteration | Re-register / evolve off-chain | Contract upgrade or redeploy |
| SDS SDK model | Matches SDS quickstart (EOA or service calls `streams.set()`) | Non-standard for SDS |
| Frontend redundancy | Subscribe to SDS + raw chain events | Single path |

**Verification:** EOA publisher is supported. Schema registration and `streams.set()` succeeded from deployer EOA `0x0C503557CC81701037240e982c9520Aa1ffca4Cc`. No on-chain publisher contract required.

---

## 2. Registered schemas

Registration tx: [`0x60b98173b2fea4b4fe90167ebe06d503e2354651d315617328eca041ee19006c`](https://shannon-explorer.somnia.network/tx/0x60b98173b2fea4b4fe90167ebe06d503e2354651d315617328eca041ee19006c) (gas: **8,036,790**)

| Schema name | Field layout | Computed schemaId | dataId pattern |
|-------------|--------------|-------------------|----------------|
| `oracle-arena:bounties:v1` | `uint64 createdAt, uint256 bountyId, address poster, bytes32 bountyType, string claim, uint64 deadline, uint256 payout, uint8 status` | `0x09919185110d7e1d045d50b87c073c7073e2d86b5e93e57a4740c8dc2fb28565` | `keccak256("bounty:" \|\| bountyId)` |
| `oracle-arena:submissions:v1` | `uint64 submittedAt, uint256 bountyId, address resolver, bytes32 verdictHash, uint16 confidence, string evidenceUri` | `0x41d7f0feed01d47b98720bfe6b89c9bc618d4ecfd586849c37d14a4c7e268c9d` | `keccak256("submission:" \|\| bountyId \|\| resolver)` |
| `oracle-arena:resolvers:v1` | `uint64 registeredAt, address agent, address operator, uint256 bond, uint64 resolutionsAttempted, uint64 resolutionsAgreed, uint256 totalEarnings, uint8 status` | `0xac19c137ad183b19b00bc9693859d90aafad6a0f33bd9db57a3ae8756ef42e29` | `keccak256("resolver:" \|\| agent)` |
| `oracle-arena:settlements:v1` | `uint64 settledAt, uint256 bountyId, bytes32 winningVerdictHash, address[] winners, uint256[] shares, uint256 feeAmount` | `0xae11e83c399c4040a638ee9d13c12d2b64bb1fc76eb555e2cd47d3aaa6177185` | `keccak256("settlement:" \|\| bountyId)` |

TypeScript types: `packages/types/src/sds.ts`.

---

## 3. On-chain event → schema mapping

| Contract | Events | Target schema |
|----------|--------|---------------|
| BountyBoard v3 | `BountyPosted`, `BountyCancelled`, `BountySettled`, `BountyUnresolved` | bounties |
| ConsensusEngine v2 | `VerdictReceived`, `ConsensusReached` | submissions / settlements |
| Settlement | `BountySettled` | settlements |
| ResolverRegistry v4 | `AgentRegistered`, `ReputationUpdated`, `WithdrawalRequested`, `WithdrawalCompleted` | resolvers |

---

## 4. Smoke test (2026-05-25)

### On-chain triggers

| Action | Tx | Gas |
|--------|-----|-----|
| Post test bounty #2 (0.1 STT) | [`0xd67b03b5…`](https://shannon-explorer.somnia.network/tx/0xd67b03b5d22f190f7ad0ba8900fd6ae1e53f5dd2266527e2da3d569172f24bdb) | 2,368,485 |
| Cancel bounty #2 | [`0x29b05074…`](https://shannon-explorer.somnia.network/tx/0x29b050744817be290b6e16c6c4d615575fbe6f834fee9baef85b43f6e5cf7fe5) | 62,949 |

### SDS publish txs

| Record | Status | Publish tx | Gas |
|--------|--------|------------|-----|
| Bounty #2 (Open) | `status=0` | [`0x0a6177db…`](https://shannon-explorer.somnia.network/tx/0x0a6177db1b9fb911f0374c2abb7ed39c9338e316ca0cf0cf97e6ed3cac11f38b) | 2,555,428 |
| Bounty #2 (Cancelled) | `status=4` | [`0x1af71a7e…`](https://shannon-explorer.somnia.network/tx/0x1af71a7effbc3a39d5cfe7c77c8d387948f54ced5ffdd0045fca49b4f720deae) | 351,053 |

Read-back via `pnpm sds-publish:read 2` confirmed decoded record: claim `"SDS publisher smoke test bounty"`, `status=4` (Cancelled), `payout=0.1 STT`.

Publisher listener verified starting cleanly (`watchContractEvent` on all four contracts). Full stdout captured in `docs/findings/sds-publisher-smoke.log`.

**Note:** Smoke publish used `publish-bounty-from-chain.ts` backfill helper because bounty #2 was posted before the live listener was running. Live listener is ready for frontend phase event capture.

---

## 5. How to run

```bash
# From repo root
pnpm install

# One-time schema registration (idempotent)
pnpm sds-publish:setup-schemas

# Long-lived listener (demo / dev server)
pnpm sds-publish:run

# Read back a bounty record
pnpm sds-publish:read <bountyId>
```

Environment (see `apps/sds-publisher/.env.example`):

- `SOMNIA_RPC_URL` — defaults to Somnia testnet
- `SDS_PUBLISHER_PRIVATE_KEY` — dedicated EOA for SDS txs (falls back to `contracts/.env` `PRIVATE_KEY` for testnet)
- Contract addresses default from `@oracle-arena/config`

---

## 6. Mainnet deployment notes

| Setting | Testnet | Mainnet change |
|---------|---------|----------------|
| RPC URL | `https://api.infra.testnet.somnia.network` | Mainnet RPC from Somnia docs |
| Publisher EOA | Deployer test key | Dedicated hot wallet with SDS publish budget |
| Contract addresses | `packages/config/src/somnia.ts` | Redeploy stack + update config |
| Schema names | `oracle-arena:*:v1` | Consider `v2` suffix on breaking layout changes |
| Schema registration | One-time per chain | Re-run `setup-schemas` on mainnet |

---

## 7. Spec deviations

1. **Helper scripts added:** `read-record.ts`, `publish-bounty-from-chain.ts` — not in original spec; used for smoke verification and backfill.
2. **`schema-ids.ts`, `sdk.ts`, `publish.ts`** — split from monolithic `publisher.ts` / `setup-schemas.ts` for clarity.
3. **Publisher key:** testnet uses deployer key via `PRIVATE_KEY` fallback; production should set `SDS_PUBLISHER_PRIVATE_KEY`.
4. **Minimum test bounty:** BountyBoard v3 enforces **0.1 STT** minimum payout (not 0.01 STT).

---

*Last updated: 2026-05-25 — SDS publisher live, smoke test verified*
