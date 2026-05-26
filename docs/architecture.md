# Architecture

Extended architecture documentation for Oracle Arena. The canonical overview lives in the root [README](../README.md).

## TODO — content to add here

- [ ] Full component interaction sequence diagrams (beyond README ASCII)
- [ ] On-chain vs SDS reasoning split — implementation notes for StreamPublisher
- [ ] Reactive subscription model — verify against Somnia docs and document final API
- [ ] inferToolsChat tool loop — Option A vs B decision record after testnet verification
- [ ] Contract dependency graph and access control matrix
- [ ] Phase 1 vs Phase 2 feature boundary checklist

## Directory map

| Path | Purpose |
|------|---------|
| `contracts/src/interfaces/` | Canonical contract APIs |
| `contracts/src/libraries/` | Shared Solidity types (`BountyTypes`) |
| `packages/config/` | Chain IDs, platform addresses, agent IDs |
| `packages/types/` | TypeScript types mirroring on-chain structs |
| `apps/web/` | Product frontend (SDS-driven, no backend) |
