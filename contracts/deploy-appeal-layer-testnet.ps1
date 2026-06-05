# Deploy AppealLayer on Somnia testnet and wire to ResolverRegistry v4
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) { throw "Missing contracts/.env" }

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$privateKey = (Get-Content ".env" | Where-Object { $_ -match '^PRIVATE_KEY=' }) -replace '^PRIVATE_KEY=',''
if ([string]::IsNullOrWhiteSpace($privateKey)) { throw "PRIVATE_KEY missing in contracts/.env" }

if (-not $env:SOMNIA_RPC) {
    $env:SOMNIA_RPC = (Get-Content ".env" | Where-Object { $_ -match '^SOMNIA_RPC_URL=' }) -replace '^SOMNIA_RPC_URL=',''
}
if (-not $env:SOMNIA_RPC) { $env:SOMNIA_RPC = "https://api.infra.testnet.somnia.network" }

$env:BOUNTY_BOARD_ADDRESS = "0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290"
$env:RESOLVER_REGISTRY_ADDRESS = "0x0AcEF373884b7843592904e74F87ABD46ca035CF"
$env:CONSENSUS_ENGINE_ADDRESS = "0xB2495D336d59D193Fa2463b95248dE240aBfe6df"
$env:MIN_CHALLENGE_BOND_WEI = "50000000000000000"

& $forge script script/DeployAppealLayer.s.sol:DeployAppealLayer `
  --rpc-url $env:SOMNIA_RPC `
  --broadcast `
  --private-key $privateKey `
  --gas-estimate-multiplier 8000 `
  -vvv

Write-Host "Update packages/config/src/somnia.ts appealLayer with the logged address, then pnpm --filter @oracle-arena/config build"
