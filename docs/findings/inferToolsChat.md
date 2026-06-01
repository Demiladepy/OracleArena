# inferToolsChat — Testnet Verification Findings

**Status:** **LIVE — RESPONSE VERIFIED** (2026-05-31). Root cause of prior failures was **wrong platform contract address**, not an offline subcommittee.

---

## 1. Summary

`inferToolsChat` is the LLM Inference agent method for MCP URLs + on-chain tool definitions. Platform callbacks ABI-decode to a **six-field tuple** per Somnia docs — **verified on live testnet**.

**Verified shape (NOT hypothesis A):**

```solidity
(
    string finishReason,
    string response,
    string[] updatedRoles,
    string[] updatedMessages,
    string[] pendingToolCallIds,
    bytes[] pendingToolCalls
) = abi.decode(responses[0].result, (string, string, string[], string[], string[], bytes[]));
```

When `finishReason == "tool_calls"`, the handler must execute `pendingToolCalls` (yield & resume pattern for multi-iteration flows).

---

## 2. Root cause of prior failures

| Platform | Address | Result |
|----------|---------|--------|
| **Wrong** (outdated dev guide blog) | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` | `AgentRequester: not enough active members` |
| **Correct** ([agents explorer](https://agents.testnet.somnia.network/)) | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` | **Works** — active validators, real callbacks |

See `docs/findings/platform-address-correction.md`.

---

## 3. Live probe (correct platform)

| Field | Value |
|-------|-------|
| **Probe v2** | `0x8bd481D5E202561A9aE09ff8Ab3E41D175F2B6f2` |
| **Deploy tx** | [`0xe247e2b3…`](https://shannon-explorer.somnia.network/tx/0xe247e2b3895a2378622d2c5eca6d08b2196b3c280b6afed7804c5deb47c4985b) |
| **Invoke tx** | [`0x34b5bdc5…`](https://shannon-explorer.somnia.network/tx/0x34b5bdc52e9fa041edbad266ad9a2e2795b26cc29d4839df0ce4a76128ed8e3f) |
| **Request ID** | 3524009 |
| **Deposit** | 0.288 STT |
| **callbackReceived** | **true** (~90s) |
| **lastStatus** | Success (2) |
| **finishReason** | `"tool_calls"` |
| **pendingToolCallIds** | `["call_0"]` |
| **pendingToolCalls[0]** | `setNumber(42)` calldata (`0x3fb5c1cb…2a`) |
| **lastNumber** | 0 (probe stores raw bytes; does not auto-execute tools) |

### Hypothesis test results

| Hypothesis | Shape | Result |
|------------|-------|--------|
| A | `(string, uint256, bytes)` | **Wrong** — does not match live bytes |
| B | `(string, ToolCall[])` | Not tested — wrong layout |
| C | `(string rawJson)` | Not tested — wrong layout |
| **Official / Docs** | **6-tuple above** | **Verified** |

---

## 4. ResolverAgent decoder update

`ResolverAgent.sol` updated to decode the verified 6-tuple. On `tool_calls`, executes `submitVerdict(bytes32,uint16,string)` calldata from `pendingToolCalls[0]` via self-call.

**Bug fixed:** `handleResponse` was deleting `pendingRequests[requestId]` before tool execution — caused `UnknownRequest` on callback path.

---

## 5. Live agent evaluation (ResolverAgent v3)

| Field | Value |
|-------|-------|
| Agent | `0x490B7B63301025CE2970b25F623Dbe963a13e60B` |
| evaluateBounty tx | [`0xf215f787…`](https://shannon-explorer.somnia.network/tx/0xf215f78735f08723117a0939e4addd9cdbb7d1b0b6bd2c62668d41ebc9ced4e3) |
| Platform requestId | 3524379 |
| Verdict submitted | **Yes** — 1 submission on ConsensusEngine for bounty #1 |
| LLM verdict | "The claim is false." (50% confidence) |

---

## 6. Legacy probe (wrong platform)

| Field | Value |
|-------|-------|
| Probe v1 | `0xB9f15fc7d54B0B2B575903fAF125c559BD474c3E` |
| Failed invoke | [`0xaca33fda…`](https://shannon-explorer.somnia.network/tx/0xaca33fda954fbf9fed89d3347d1a32c84b260bb9f45109da8f2ceace6dfae17c) |
| Error | `AgentRequester: not enough active members` |

---

*Last updated: 2026-05-31 — inferToolsChat verified on correct platform*
