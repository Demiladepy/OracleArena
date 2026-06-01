# ResolverAgent v3 — Deployment & Live Evaluation

**Status:** **LIVE** (2026-05-31). Correct SomniaAgents platform + verified 6-tuple inferToolsChat decoder.

---

## Diff vs v2

| Aspect | v2 | v3 |
|--------|----|----|
| Platform | `0x7407cb35…` (wrong) | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| Decoder | Hypothesis A mock | Verified 6-tuple + `tool_calls` execution |
| Live evaluateBounty | Reverts at platform | **Succeeds** — real LLM verdict on CE v2 |

ConsensusEngine wiring unchanged from v2.

---

## Deployed address

| Field | Value |
|-------|-------|
| **ResolverAgent v3** | `0x490B7B63301025CE2970b25F623Dbe963a13e60B` |
| Deploy tx | [`0x28eac005…`](https://shannon-explorer.somnia.network/tx/0x28eac005fc623d83586b41780392e6ec18a057966da41d74539037b1849eec7e) |
| Register tx | [`0x4c2d071d…`](https://shannon-explorer.somnia.network/tx/0x4c2d071d8a9c73fa3e5525dfe49096484e28a1739e72a235aa8b521dd69ace50) |
| CrossChain pref tx | [`0x79eb0238…`](https://shannon-explorer.somnia.network/tx/0x79eb023856014dc33f5c81e8e08f5474472f6b64d68786b17037c0cf07964eeb) |

---

## evaluateBounty on demo bounty #1

| Field | Value |
|-------|-------|
| Tx | [`0xf215f787…`](https://shannon-explorer.somnia.network/tx/0xf215f78735f08723117a0939e4addd9cdbb7d1b0b6bd2c62668d41ebc9ced4e3) |
| Gas | 660,144 |
| Platform requestId | 3524379 |
| CE submissions | 1 (consensus pending — needs 2nd resolver) |
| Verdict | "The claim is false." @ 50% confidence |

---

## Tests

29/29 `ResolverAgentTest` passing after decoder + pendingRequests fix.

---

*Supersedes resolveragent-v2.md for current demo wiring*
