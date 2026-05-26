# inferToolsChat — Testnet Verification Findings

**Status:** Probe contracts and scripts ready. **Live testnet callback not yet captured** — deployer wallet had 0 STT at verification time (2026-05-25).

**Runbook to complete verification:** fund deployer with ≥2 STT, run `ProbeInferToolsChat.s.sol`, wait 60s, run `ReadProbeResult.s.sol`, paste raw hex into `DecodeProbeResponse.t.sol`, update this document.

---

## 1. Summary

`inferToolsChat` is the LLM Inference agent method that lets a contract supply MCP server URLs and **on-chain tool definitions** (Solidity signature strings). The agent runs an internal LLM↔tool loop (up to `maxIterations`). The platform returns consensus-encoded bytes to `handleResponse`; those bytes ABI-decode to a **six-field tuple**, not a single string or opaque JSON blob.

When the model wants the caller to execute an on-chain tool, `finishReason` is `"tool_calls"` and `pendingToolCalls[]` contains ready-to-execute calldata (4-byte selector + ABI args). The caller executes them, appends tool results to the conversation, and **calls `inferToolsChat` again** with `updatedRoles` / `updatedMessages` — this is **Option B (multi-tick)**, not a single opaque internal loop inside one platform request.

---

## 2. Interface source (Step 1)

| Item | Value |
|------|-------|
| **Requested source** | `https://github.com/SomniaDevs/somnia-agents-examples` |
| **Result** | **404 — repository not accessible** at verification time |
| **Authoritative substitute** | Official Somnia documentation (copied verbatim into `contracts/src/interfaces/IAgentRequester.sol`) |
| **Primary URLs** | [Invoking from Solidity](https://docs.somnia.network/agents/invoking-agents/from-solidity.md), [LLM Inference](https://docs.somnia.network/agents/base-agents/llm-inference.md), [Gas Fees](https://docs.somnia.network/agents/invoking-agents/gas-fees.md) |
| **Copy date** | 2026-05-25 |
| **Cross-check** | Community mirror `Kali-Decoder/Somnia-Agentic-examples` @ `b570d0b78bbe27acc6dd15f357d4439a45ac8b44` — platform interface matches docs; **does not include `inferToolsChat` in `ILLMAgent`** (docs are more complete) |

Header in `IAgentRequester.sol`:

> This is an upstream interface. Do not modify locally. If upstream changes, update by re-copying from source, do not patch by hand.

---

## 3. Verified response shape (documentation + platform deposit; callback bytes pending live run)

### Agent method return (what validators execute)

```solidity
function inferToolsChat(
    string[] roles,
    string[] messages,
    string[] mcpServerUrls,
    OnchainTool[] onchainTools,
    uint256 maxIterations,
    bool chainOfThought
) returns (
    string finishReason,
    string response,
    string[] updatedRoles,
    string[] updatedMessages,
    string[] pendingToolCallIds,
    bytes[] pendingToolCalls
);
```

### Platform callback (what `responses[0].result` contains)

Per Somnia docs (“Decoding Responses”), the callback `bytes result` is **ABI-encoded agent output**. For `inferToolsChat`, decode as:

```solidity
(
    string memory finishReason,
    string memory response,
    string[] memory updatedRoles,
    string[] memory updatedMessages,
    string[] memory pendingToolCallIds,
    bytes[] memory pendingToolCalls
) = abi.decode(responses[0].result, (string, string, string[], string[], string[], bytes[]));
```

### `finishReason` semantics (from docs)

| Value | Meaning |
|-------|---------|
| `"stop"` | Final text in `response`; empty pending arrays |
| `"tool_calls"` | Execute each `pendingToolCalls[i]`, append tool results, resume with updated conversation |
| `"max_iterations"` | Hit iteration limit without final answer |

### Hypothesis matrix (for `DecodeProbeResponse.t.sol`)

| ID | Hypothesis | Expected for inferToolsChat |
|----|------------|----------------------------|
| Official | 6-tuple above | **Primary — matches Somnia docs** |
| A | `(string, uint256, bytes)` | Unlikely |
| C | `(string)` JSON only | Unlikely |
| D | Legacy triple | Unlikely |

**Live testnet raw bytes:** `PENDING` — populate `CAPTURED_RAW_HEX` in `contracts/test/utils/DecodeProbeResponse.t.sol` after probe run.

---

## 4. Tool-loop semantics (architectural implication)

Official Somnia docs describe **yield & resume** for on-chain tools:

1. First `createRequest` with `inferToolsChat` payload.
2. Callback with `finishReason == "tool_calls"` → execute `pendingToolCalls[i]` on local contract.
3. Append tool result messages to `updatedRoles` / `updatedMessages`.
4. Second `createRequest` with resumed conversation state.

This **updates our README assumption** (“Option A: one reactive trigger → one inferToolsChat with internal tool loop”). The platform runs MCP tools internally, but **on-chain tools require multiple agent requests** — at minimum two platform calls for one tool round-trip.

`ResolverAgent` should model an **investigation state machine**: pending request ID → tool execution → resume → verdict submission.

---

## 5. Platform addresses & deposit economics

### Platform contract (testnet)

| Source | Address |
|--------|---------|
| Oracle Arena README | `0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3` |
| Somnia docs (from-solidity) | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |

Both addresses return bytecode on chain ID `50312` and `getRequestDeposit() = 0.03 STT` (3e16 wei) via RPC on 2026-05-25. Probe uses README address.

### Deposit formula (LLM Inference, subcommittee size 3)

```
floor   = getRequestDeposit()           = 0.03 STT
reward  = 0.07 STT × 3                 = 0.21 STT
deposit = (floor + reward) × 1.20      = 0.288 STT  (20% buffer)
```

Verified via `cast call` on testnet. Matches [Gas Fees](https://docs.somnia.network/agents/invoking-agents/gas-fees.md) practical table (0.24 STT minimum + buffer).

### Actual cost

**Pending live run** — compare `msg.value` sent vs rebate received on `RequestFinalized` / contract balance after callback.

---

## 6. Probe artifacts

| Artifact | Path |
|----------|------|
| Probe contract | `contracts/src/probes/ToolsChatProbe.sol` |
| Deploy + invoke | `contracts/script/ProbeInferToolsChat.s.sol` |
| Read results | `contracts/script/ReadProbeResult.s.sol` |
| Decode tests | `contracts/test/utils/DecodeProbeResponse.t.sol` |

### Probe configuration

- **Agent ID:** `12847293847561029384` (LLM Inference)
- **On-chain tool offered:** `setNumber(uint256)` on the probe contract
- **System prompt:** *"You are a probe agent. When asked, choose to call the setNumber tool with the integer you receive."*
- **User message:** *"Please call setNumber with the integer 42."*
- **maxIterations:** 5
- **chainOfThought:** false

### Testnet run attempt (2026-05-25)

| Field | Value |
|-------|-------|
| Deployer | Ephemeral wallet (see local `contracts/.env` — **not committed**) |
| Deployer balance | **0 STT** |
| Simulation deploy address | `0x6884f7dB0D020F782b39f84930A9B2ec4eDfaE99` (CREATE2 nonce-dependent — **not broadcast**) |
| `probe()` tx hash | **Not broadcast** — `OutOfFunds` |
| Callback tx hash | **N/A** |
| `lastRawResponse` | **N/A** |

### Commands to complete verification

```bash
cd contracts
# Set PRIVATE_KEY in .env (wallet with ≥2 STT)
forge script script/ProbeInferToolsChat.s.sol:ProbeInferToolsChat \
  --rpc-url https://api.infra.testnet.somnia.network \
  --broadcast -vvv

# Wait 30–60 seconds, then:
PROBE_ADDRESS=0x... forge script script/ReadProbeResult.s.sol:ReadProbeResult \
  --rpc-url https://api.infra.testnet.somnia.network -vvv

# Paste hex into DecodeProbeResponse.t.sol CAPTURED_RAW_HEX, then:
forge test --match-path test/utils/DecodeProbeResponse.t.sol -vv
```

STT faucets: [testnet.somnia.network](https://testnet.somnia.network/), [thirdweb Somnia Shannon](https://thirdweb.com/somnia-shannon-testnet), [Stakely](https://stakely.io/faucet/somnia-testnet-stt), Discord `#dev-chat`.

---

## 7. Failure modes observed

| Failure | Context | Mitigation |
|---------|---------|------------|
| `OutOfFunds` | Deployer had 0 STT | Fund wallet before broadcast |
| `NotActivated` on `getRequestDeposit()` | Foundry **local simulation** (no RPC state) | Inline deposit in script or fork testnet |
| SomniaDevs examples repo 404 | GitHub | Use official docs; re-try repo later |

**Not yet observed:** timeout, `ResponseStatus.Failed`, insufficient `perAgentBudget`, malformed decode.

---

## 8. README / architecture updates required

1. **Tool loop model:** Change from “Option A single internal loop” to **yield & resume** for on-chain tools (documented above). MCP tools may complete inside one agent execution; on-chain tools do not.
2. **Platform address:** Note docs list `0x037B…` while README lists `0x7407…` — both respond on testnet; pick one canonical address after Somnia confirms.
3. **`Request` struct:** Add `perAgentBudget` field (now in interface from docs).
4. **ResolverAgent design:** State machine for multi-request investigations, not single callback → verdict.

---

## 9. Open questions (need live bytes)

- [ ] Confirm `responses[0].result` decodes as 6-tuple on live testnet (expected yes).
- [ ] For our probe prompt, does the model return `finishReason == "tool_calls"` with `setNumber(42)` calldata?
- [ ] Actual STT cost after rebate for one tool-call round (one or two platform requests).
- [ ] Latency from `probe()` tx to callback tx (docs say up to ~15 min timeout; expect seconds–minutes).
- [ ] Whether `inferToolsChat` with **only** on-chain tools (no MCP) behaves identically to docs.

---

## 10. Interface update

`IResolverAgent.sol` updated with:

- NatSpec decoding pattern referencing this document
- `InferToolsChatResult` struct mirroring verified tuple
- `InferToolsChatPending` event for `tool_calls` path
- Reactive subscription TODO unchanged (separate verification phase)

`decodeInferToolsChatResult` is documented as the recommended **library/helper** pattern for implementations — not yet implemented in `ResolverAgent.sol`.

---

*Last updated: 2026-05-25 — Oracle Arena verification phase*
