# Platform Address Correction

**Status:** **VERIFIED — wrong platform was root cause of probe failures**

---

## Summary

Every `inferToolsChat` probe and `evaluateBounty` call failed with `AgentRequester: not enough active members` because ResolverAgent and ToolsChatProbe were wired to **`0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3`** — an outdated address from the Somnia dev guide blog post.

The live Somnia Agents platform on testnet is **`0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`**, per [agents.testnet.somnia.network](https://agents.testnet.somnia.network/).

**Lesson:** When docs and a live explorer disagree, trust the explorer.

---

## Step 1 — Sanity checks (2026-05-31)

| Check | Result |
|-------|--------|
| `cast code 0x037Bb9C…` | **Non-empty bytecode** — contract exists |
| `cast code 0x7407cb35…` | **Non-empty bytecode** — old address also has code (likely stale deployment) |
| `getRequestDeposit()` new platform | **0.03 STT** |
| `getRequestDeposit()` old platform | **0.03 STT** |
| AgentRegistry `platform()` | Reverts — no such getter |
| AgentRegistry `agentRequester()` | Reverts |
| AgentRegistry `somniaAgents()` | Reverts |
| AgentRegistry `owner()` | Reverts |

Registry at `0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A` does not expose a platform pointer via common getters. **Authoritative source: agents explorer.**

Agent IDs unchanged and match `packages/config/src/agents.ts`:
- JSON API: `13174292974160097713`
- LLM Inference: `12847293847561029384`
- LLM Parse Website: `12875401142070969085`

---

## Addresses

| Role | Wrong (legacy) | Correct (live) |
|------|----------------|----------------|
| SomniaAgents platform | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| AgentRegistry | `0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A` | unchanged ✓ |

---

## Codebase changes

- `packages/config/src/somnia.ts` — `platformContract` updated; old address in `legacyAddresses.platformContractWrong`
- `packages/config/src/agents.ts` — re-exports `platformContract` from somnia config
- `contracts/script/DeployToolsChatProbe.s.sol` — default platform updated
- `contracts/script/DeployFullDemoAgent.s.sol` — default platform updated; `SKIP_DEMO_BOUNTY_POST` for agent-only redeploys

## Redeployments triggered

| Contract | Old | New | Notes |
|----------|-----|-----|-------|
| ToolsChatProbe | `0xB9f15fc7…` | `0x8bd481D5…` | Immutable platform |
| ResolverAgent | `0xb01e811a…` (v2) | `0x490B7B63…` (v3) | Immutable platform + decoder |

### Transaction hashes

| Action | Tx | Gas |
|--------|-----|-----|
| Probe deploy | [`0xe247e2b3…`](https://shannon-explorer.somnia.network/tx/0xe247e2b3895a2378622d2c5eca6d08b2196b3c280b6afed7804c5deb47c4985b) | 17,148,806 |
| Probe invoke | [`0x34b5bdc5…`](https://shannon-explorer.somnia.network/tx/0x34b5bdc52e9fa041edbad266ad9a2e2795b26cc29d4839df0ce4a76128ed8e3f) | 805,571 |
| Agent v3 deploy | [`0x28eac005…`](https://shannon-explorer.somnia.network/tx/0x28eac005fc623d83586b41780392e6ec18a057966da41d74539037b1849eec7e) | 17,163,888 |
| evaluateBounty(1) | [`0xf215f787…`](https://shannon-explorer.somnia.network/tx/0xf215f78735f08723117a0939e4addd9cdbb7d1b0b6bd2c62668d41ebc9ced4e3) | 660,144 |

*Last updated: 2026-05-31 — platform fix verified, live verdict submission confirmed*
