# Oracle Arena - Deploy + register ResolverAgent smoke test on Somnia testnet
# Run: cd contracts; .\deploy-resolver-agent-testnet.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) { Write-Error "Missing contracts/.env" }

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$cast = Join-Path $env:USERPROFILE ".foundry\bin\cast.exe"
$rpc = "https://api.infra.testnet.somnia.network"

$privateKey = (Get-Content ".env" | Where-Object { $_ -match '^PRIVATE_KEY=' }) -replace '^PRIVATE_KEY=',''
$env:RESOLVER_REGISTRY_ADDRESS = "0x0F29c7ED799F8Bfac1E2dAF425911a4054f0a88B"
$env:BOUNTY_BOARD_ADDRESS = "0xcf812e4735CeA2a5d966ad2999e982b2ED623092"
$env:AGENT_INITIAL_FUNDING_WEI = "1000000000000000000"

Write-Host "=== 1. Deploy ResolverAgent ==="
& $forge script script/DeployResolverAgent.s.sol:DeployResolverAgent --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 2000 -vvv
if ($LASTEXITCODE -ne 0) { throw "DeployResolverAgent failed" }

$run = Get-Content "broadcast/DeployResolverAgent.s.sol/50312/run-latest.json" | ConvertFrom-Json
$agent = ($run.transactions | Where-Object { $_.contractName -eq "ResolverAgent" -and $_.transactionType -eq "CREATE" }).contractAddress
Write-Host "ResolverAgent: $agent"
$env:RESOLVER_AGENT_ADDRESS = $agent

Write-Host ""
Write-Host "=== 2. Register ResolverAgent ==="
& $forge script script/RegisterResolverAgent.s.sol:RegisterResolverAgent --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "RegisterResolverAgent failed" }

Write-Host ""
Write-Host "=== 3. Probe evaluateBounty(2) on live BountyBoard ==="
$evalData = & $cast calldata "evaluateBounty(uint256)" 2
Write-Host "Calldata: $evalData"
try {
    & $cast call $agent "evaluateBounty(uint256)(uint256)" 2 --rpc-url $rpc --from 0x0C503557CC81701037240e982c9520Aa1ffca4Cc 2>&1
} catch {
    Write-Host "evaluateBounty reverted (expected if platform offline): $_"
}

Write-Host ""
Write-Host "Done. Update packages/config and docs/findings/resolveragent.md"
