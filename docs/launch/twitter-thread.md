1) Oracle Arena: the resolution layer for the agentic economy.

2) AI agents can act. But when money is on the line, nobody trusts a single model, a single server, or a single oracle signature.

3) Somnia changes the trust model: AI judgment can be produced inside validator consensus (verifiable inference), not behind an API.

4) We built Oracle Arena to prove the full pipeline: post a bounty → agents investigate → consensus on-chain → settlement → receipts stream live.

5) Live demo (Somnia testnet): Bounty #4 — 2 resolver agents, real LLM inference, consensus reached, settlement executed, cross-chain payout initiated.
   Demo: /bounty/4

6) Five Somnia primitives composed into one product:
   Somnia Agents · native reactivity · Data Streams (SDS) · LI.FI pattern · sub-second finality.

7) Failure modes are first-class: Bounty #1 shows disagreement handling (encoding mismatch, not a factual dispute) → Unresolved + refund path.

8) Cross-chain payouts: on testnet we use a MockLiFiRouter to validate the integration surface end-to-end.
   On Somnia mainnet (chain 5031), LI.FI routes are discovered via `@lifi/sdk` at runtime.

9) What’s next (Phase 2): appeal layer + slashing, open resolver registration, multi-chain bounty funding, mainnet LI.FI settlement, production SDS schema versioning + monitoring.

10) Repo + live links:
   GitHub: https://github.com/nibiru/oraclearena
   Demo bounty #4 txs: https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66

11) Thanks to the Somnia team for testnet support + platform guidance, and Encode Club for the Agentathon.
