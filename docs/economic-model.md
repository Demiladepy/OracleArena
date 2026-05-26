# Economic Model

Extended economic model for Oracle Arena. Summary lives in the root [README](../README.md).

## TODO — content to add here

- [ ] Protocol fee (2%) — treasury usage and refund economics
- [ ] Resolver bonds (50 STT MVP) — sizing rationale and Phase 2 dynamic bonds
- [ ] Payout split (60/40 MVP) — transition to reputation-weighted payouts
- [ ] Appeal economics (Phase 2) — challenger bond, slash distribution, burn rate
- [ ] Agent call cost accounting — Somnia agent pricing vs bounty minimums
- [ ] Parameter governance roadmap (owner → DAO)

## Key parameters (MVP)

| Parameter | Value | Location |
|-----------|-------|----------|
| Protocol fee | 2% | `packages/config/src/somnia.ts` |
| Minimum resolver bond | 50 STT | `protocolConfig.minimumResolverBondWei` |
| First submitter share | 60% | `protocolConfig.firstSubmitterShareBps` |
| Second submitter share | 40% | `protocolConfig.secondSubmitterShareBps` |
