# Phase 2 sprint plan (deadline: 10 June 2026)

Roadmap items from README, ordered for the extension window.

## Status

| Item | Status | Notes |
|------|--------|-------|
| Open resolver registration | **UI shipped** | `/register` — on-chain `registerAgent` was already public |
| Appeal layer + slashing | **Contracts + tests** | `AppealLayer.sol`, `DeployAppealLayer.s.sol` — deploy to testnet next |
| SDS schema v2 + monitoring | **In progress** | `appeals:v1` schema + publisher health endpoint |
| Multi-chain inbound posting | **Documented + UI copy** | LI.FI inbound on mainnet; testnet stays native STT |
| Mainnet LI.FI | **Config scaffold** | `packages/config/src/somnia-mainnet.ts` — needs diamond address + deploy |

## Deploy AppealLayer (testnet)

```powershell
cd contracts
$env:BOUNTY_BOARD_ADDRESS="0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290"
$env:RESOLVER_REGISTRY_ADDRESS="0x0AcEF373884b7843592904e74F87ABD46ca035CF"
$env:CONSENSUS_ENGINE_ADDRESS="0xB2495D336d59D193Fa2463b95248dE240aBfe6df"
forge script script/DeployAppealLayer.s.sol:DeployAppealLayer --rpc-url $env:SOMNIA_RPC --broadcast
```

After deploy, set `appealLayer` in `packages/config/src/somnia.ts` and redeploy web.

## Multi-chain inbound (mainnet)

1. User funds Somnia wallet via [LI.FI SDK](https://docs.li.fi) (source chain → Somnia mainnet 5031).
2. User posts bounty with native SOMI on `BountyBoard.postBounty` (unchanged contract API).
3. Outbound resolver payouts already route via `Settlement` → `LiFiAdapter`.

Testnet: inbound remains native STT; mock router continues for outbound demos.

## Tests

```bash
cd contracts && forge test --match-contract AppealLayerTest
```
